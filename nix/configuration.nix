{ lib, pkgs, ... }:

{
  imports = [
    # Include the results of the hardware scan.
    ./hardware-configuration.nix
  ];

  # Use the extlinux boot loader. (NixOS wants to enable GRUB by default)
  boot.loader.grub.enable = false;
  # Enables the generation of /boot/extlinux/extlinux.conf
  boot.loader.generic-extlinux-compatible.enable = true;

  networking.hostName = "dashboard"; # Define your hostname.

  # Configure network connections interactively with nmcli or nmtui.
  networking.networkmanager.enable = true;

  time.timeZone = "America/Los_Angeles";

  networking.firewall.enable = true;
  services.openssh.enable = true;

  environment.systemPackages = with pkgs; [
    chromium
    foot
    git
  ];

  programs.sway = {
    enable = true;
  };

  # Disable xdg portal for chromium --no-sandbox
  services.dbus.packages = [ pkgs.xdg-desktop-portal-gtk ];
  xdg.portal.enable = lib.mkForce false;

  # Sway config for kiosk mode
  environment.etc."sway/config".text = ''
    set $mod Mod1
    set $term ${pkgs.foot}/bin/foot

    default_border none
    default_floating_border none

    for_window [app_id="chrome-bfd.firecat53.com__-Default"] fullscreen disable
    for_window [app_id="chrome-cadmon.cob.org__-Default"] fullscreen disable

    exec_always 'swaymsg "workspace 1; layout splith"'
    exec chromium --no-sandbox --kiosk --app="https://bfd.firecat53.com" 
    exec 'swaymsg "workspace 1; layout splith"'
    exec sh -c 'sleep 2 && chromium --no-sandbox --new-window --kiosk --app="https://cadmon.cob.org"'

    # Emergency keybindings for maintenance
    bindsym $mod+Return exec $term
    bindsym $mod+e exit
  '';

  # Auto-login and start sway
  services.getty.autologinUser = "dashboard";

  systemd.user.services.sway = {
    description = "Sway compositor";
    wantedBy = [ "graphical-session.target" ];
    after = [ "graphical-session-pre.target" ];
    wants = [ "graphical-session-pre.target" ];
    environment = {
      XDG_RUNTIME_DIR = "/run/user/1000";
      WLR_RENDERER = "pixman"; # Software renderer for better Pi compatibility
    };
    serviceConfig = {
      Type = "simple";
      ExecStart = "${pkgs.sway}/bin/sway";
      Restart = "on-failure";
    };
  };

  # Enable keyboard and mouse
  services.libinput.enable = true;

  users.users.dashboard = {
    isNormalUser = true;
    extraGroups = [
      "video"
      "wheel"
    ];
    password = "dashboard";
  };

  system.stateVersion = "25.11";
}
