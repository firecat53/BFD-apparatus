# build-server.nix — Reference configuration for the remote build host.
#
# Merge the relevant options into your server's configuration.nix.
# This is NOT a standalone module — it's a reference for what to add.
#
# If your server is x86_64-linux, it needs binfmt/QEMU to build
# aarch64-linux packages for the Pi. If it's already aarch64-linux,
# remove the boot.binfmt section.
{ pkgs, ... }:

{
  # ── Cross-architecture support (x86_64 servers only) ──────────────
  # Remove this block if your server is already aarch64-linux.
  boot.binfmt.emulatedSystems = [ "aarch64-linux" ];

  # ── Dedicated build user ──────────────────────────────────────────
  users.users.nix-build = {
    isNormalUser = true;
    home = "/home/nix-build";
    openssh.authorizedKeys.keys = [
      # Paste the contents of /root/.ssh/nix-build-key.pub from the Pi
      "ssh-ed25519 AAAA... dashboard-pi"
    ];
  };

  # ── Nix daemon settings ──────────────────────────────────────────
  nix.settings.trusted-users = [ "root" "nix-build" ];

  # ── SSH access ───────────────────────────────────────────────────
  services.openssh.enable = true;
}
