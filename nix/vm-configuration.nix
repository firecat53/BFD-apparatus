{ lib, pkgs, ... }:

{
  imports = [
    # Use a minimal base configuration for VM
    <nixpkgs/nixos/modules/virtualisation/qemu-vm.nix>
  ];

  # VM-specific settings
  virtualisation = {
    memorySize = 4096;  # 2GB RAM
    cores = 2;
    graphics = true;
    qemu.options = [
      "-vga qxl"
    ];
  };

  # Use GRUB for VM (simpler than extlinux)
  boot.loader.grub.enable = true;
  boot.loader.grub.device = "/dev/vda";

  networking.hostName = "dashboard-vm";
  networking.networkmanager.enable = true;

  time.timeZone = "America/Los_Angeles";

  # Install required packages
  environment.systemPackages = with pkgs; [
    chromium
    foot  # Terminal emulator
  ];

  # Enable sway (simple tiling Wayland compositor)
  programs.sway = {
    enable = true;
  };

  services.dbus.packages = [ pkgs.xdg-desktop-portal-gtk ];
  xdg.portal.enable = lib.mkForce false;

  # Sway config for kiosk mode
  environment.etc."sway/config".text = ''
    set $mod Mod1
    set $term ${pkgs.foot}/bin/foot

    # No window borders
    default_border none
    default_floating_border none

    for_window [app_id="chrome-bfd.firecat53.com__-Default"] fullscreen disable
    for_window [app_id="chrome-cadmon.cob.org__-Default"] fullscreen disable

    exec_always 'swaymsg "workspace 1; layout splith"'
    exec chromium --no-sandbox --kiosk --app="https://bfd.firecat53.com" 
    exec 'swaymsg "workspace 1; layout splith"'
    exec sh -c 'sleep 1 && chromium --no-sandbox --new-window --kiosk --app="https://cadmon.cob.org"'

    # Emergency keybindings for maintenance
    bindsym $mod+Return exec $term
    bindsym $mod+e exit
  '';

  # Auto-login and start sway
  services.getty.autologinUser = "dashboard";

  environment.loginShellInit = ''
    if [ -z $DISPLAY ] && [ "$(tty)" = "/dev/tty1" ]; then
      exec sway
    fi
  '';

  # Enable keyboard and mouse
  services.libinput.enable = true;

  # Create dashboard user
  users.users.dashboard = {
    isNormalUser = true;
    extraGroups = [ "video" "wheel" ];
    password = "test123";  # For VM testing only
  };

  # Allow passwordless sudo for testing
  security.sudo.wheelNeedsPassword = false;

#  # Systemd services for automatic browser restart on crash
#  systemd.user.services.kiosk-left = {
#    description = "Left Kiosk Display";
#    wantedBy = [ "sway-session.target" ];
#    serviceConfig = {
#      ExecStart = "${pkgs.chromium}/bin/chromium --kiosk --app=https://cadmon.cob.org";
#      Restart = "always";
#      RestartSec = "5s";
#    };
#  };
#
#  systemd.user.services.kiosk-right = {
#    description = "Right Kiosk Display";
#    wantedBy = [ "sway-session.target" ];
#    after = [ "kiosk-left.service" ];
#    serviceConfig = {
#      ExecStart = "${pkgs.chromium}/bin/chromium --new-window --kiosk --app=https://bfd.firecat53.com";
#      Restart = "always";
#      RestartSec = "5s";
#    };
#  };

  system.stateVersion = "25.11";
}
