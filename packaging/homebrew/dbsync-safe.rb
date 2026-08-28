class DbsyncSafe < Formula
  desc "Make verified SQLite snapshots before file sync"
  homepage "https://db-file-sync-safety.sociobot.in"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.0/dbsync-safe-macos-aarch64.tar.gz"
      sha256 "RELEASE_SHA256_MACOS_ARM64"
    else
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.0/dbsync-safe-macos-x86_64.tar.gz"
      sha256 "RELEASE_SHA256_MACOS_X64"
    end
  end

  on_linux do
    url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.0/dbsync-safe-linux-x86_64.tar.gz"
    sha256 "RELEASE_SHA256_LINUX_X64"
  end

  def install
    bin.install "dbsync-safe"
  end

  test do
    assert_match "dbsync-safe", shell_output("#{bin}/dbsync-safe --help")
  end
end

