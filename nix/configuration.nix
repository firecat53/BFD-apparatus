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
  networking.networkmanager.enable = true;
  networking.networkmanager.wifi.powersave = false;
  networking.firewall.enable = true;

  time.timeZone = "America/Los_Angeles";

  services.openssh.enable = true;

  system.autoUpgrade = {
    enable = true;
    flags = [
      "--print-build-logs"
    ];
    dates = "monthly";
    randomizedDelaySec = "45min";
    allowReboot = true; # Set to true if you want automatic reboots
  };

  environment.systemPackages = with pkgs; [
    bottom
    chromium
    foot
    git
    vim
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
    exec sh -c 'sleep 5 && chromium --no-sandbox --new-window --kiosk --app="https://cadmon.cob.org"'

    # Toggle tabbed/split
    bindsym $mod+s layout toggle tabbed splith; focus left

    # Emergency keybindings for maintenance
    bindsym $mod+Return exec $term
    bindsym $mod+e exit
  '';

  # Auto-login and start sway
  services.getty = {
    autologinUser = "dashboard";
    autologinOnce = true;
  };

  environment.loginShellInit = ''
    if [[ "$(tty)" == /dev/tty1 ]]; then
      while true; do
        sway
      done
    fi
  '';

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
