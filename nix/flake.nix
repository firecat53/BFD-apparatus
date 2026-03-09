{
  description = "Dashboard kiosk NixOS SD image for Raspberry Pi 4";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
  };

  outputs = { self, nixpkgs }: {
    nixosConfigurations.dashboard = nixpkgs.lib.nixosSystem {
      modules = [
        "${nixpkgs}/nixos/modules/installer/sd-card/sd-image-aarch64.nix"
        ./configuration.nix
        ({ lib, ... }: {
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
        })
      ];
    };

    packages.x86_64-linux.sdImage =
      self.nixosConfigurations.dashboard.config.system.build.sdImage;
  };
}
