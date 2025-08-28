terraform {
  backend "azurerm" {}
}

provider "azurerm" {
  features {}
}

data "azuread_client_config" "current" {}
