#!/usr/bin/env bash
# Build and run the dashboard kiosk VM for testing

set -e

echo "Building VM configuration..."
nixos-rebuild build-vm -I nixos-config=./vm-configuration.nix

echo ""
echo "VM built successfully!"
echo ""
echo "To run the VM, execute:"
echo "  ./result/bin/run-dashboard-vm-vm"
echo ""
echo "Login credentials:"
echo "  User: dashboard"
echo "  Password: dashboard"
echo ""
echo "Keybindings (Mod = Alt):"
echo "  Mod+Return       - Open terminal"
echo "  Mod+e      - Restart Sway"
