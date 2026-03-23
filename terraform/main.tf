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
