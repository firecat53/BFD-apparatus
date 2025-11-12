#!/usr/bin/env bash
# Build and run the dashboard kiosk VM for testing

set -e

echo "Building VM configuration..."
nixos-rebuild build-vm -I nixos-config=./vm-configuration.nix

echo ""
echo "VM built successfully!"
echo ""
echo "To run the VM, execute:"
echo "  ./result/bin/run-nixos-vm"
echo ""
echo "Login credentials:"
echo "  User: dashboard"
echo "  Password: test123"
echo ""
echo "Emergency keybindings (Mod = Windows/Super key):"
echo "  Mod+Return       - Open terminal"
echo "  Mod+Shift+E      - Exit Sway"
echo "  Mod+Shift+C      - Reload Sway config"
echo ""
echo "The VM will auto-login and display two browser windows side-by-side."
