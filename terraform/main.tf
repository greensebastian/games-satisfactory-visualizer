terraform {
  backend "azurerm" {}
}

provider "azurerm" {
  subscription_id = var.subscription_id
  features {}
}

locals {
  env        = terraform.workspace
  domain     = "games"
  name       = "satisfactory-visualizer"
  identifier = "${local.domain}-${local.name}-${local.env}"
  region     = lookup(module.regions.regions_by_display_name, "North Europe", null)
}

module "naming" {
  source  = "Azure/naming/azurerm"
  version = "0.4.2"
  suffix  = [local.domain, local.name, local.env]
}

module "regions" {
  source  = "Azure/regions/azurerm"
  version = "0.8.2"
}

data "azuread_client_config" "current" {}

data "azurerm_resource_group" "rg" {
  name = module.naming.resource_group.name
}

resource "azurerm_service_plan" "plan" {
  name                = module.naming.app_service_plan.name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = data.azurerm_resource_group.rg.location

  os_type  = "Linux"
  sku_name = "F1"
}

resource "azurerm_linux_web_app" "app" {
  name                = module.naming.app_service.name
  resource_group_name = data.azurerm_resource_group.rg.name
  location            = azurerm_service_plan.plan.location
  service_plan_id     = azurerm_service_plan.plan.id
  https_only          = true

  site_config {
    always_on = false
    application_stack {
      docker_registry_url = "https://ghcr.io"
      docker_image_name   = "greensebastian/games-satisfactory-visualizer:latest"
    }
  }

  app_settings = {
    DOCKER_ENABLE_CI = "true"
  }
}

output "site_url" {
  value = azurerm_linux_web_app.app.default_hostname
}
