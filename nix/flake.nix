{
  description = "Dashboard kiosk NixOS SD image for Raspberry Pi 4";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  };

  outputs =
    { self, nixpkgs }:
    {
      nixosConfigurations.dashboard = nixpkgs.lib.nixosSystem {
        modules = [
          "${nixpkgs}/nixos/modules/installer/sd-card/sd-image-aarch64.nix"
          ./configuration.nix
          (
            { lib, pkgs, ... }:
            {
              nixpkgs.hostPlatform = "aarch64-linux";

              # sd-image-aarch64 uses /dev/disk/by-label/NIXOS_SD, but
              # hardware-configuration.nix defines "/" by UUID at equal priority.
              # Force the label-based definition so the SD image builds correctly.
              fileSystems."/" = lib.mkForce {
                device = "/dev/disk/by-label/NIXOS_SD";
                fsType = "ext4";
              };

              # Shrink image size
              documentation.nixos.enable = false;

              # Clone config repo on first boot for nixos-rebuild.
              systemd.services.clone-dashboard-repo = {
                description = "Clone dashboard config repo on first boot";
                wantedBy = [ "multi-user.target" ];
                wants = [ "network-online.target" ];
                after = [ "network-online.target" ];
                serviceConfig = {
                  Type = "oneshot";
                  RemainAfterExit = true;
                  User = "dashboard";
                };
                script = ''
                  if [ ! -d /home/dashboard/dashboard ]; then
                    ${pkgs.git}/bin/git clone \
                      https://github.com/firecat53/bfd-apparatus.git \
                      /home/dashboard/dashboard
                  fi
                '';
              };
            }
          )
        ];
      };

      packages.x86_64-linux.sdImage = self.nixosConfigurations.dashboard.config.system.build.sdImage;
    };
}
