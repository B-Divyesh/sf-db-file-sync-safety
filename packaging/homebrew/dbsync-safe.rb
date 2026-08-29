class DbsyncSafe < Formula
  desc "Make verified SQLite snapshots before file sync"
  homepage "https://db-file-sync-safety.sociobot.in"
  version "0.1.3"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.3/dbsync-safe-macos-aarch64.tar.gz"
      sha256 "06aa3b7f6d4a3e91a8bff1a0629ba7c20540d68132a07f28bac0cb8e7a59d853"
    else
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.3/dbsync-safe-macos-x86_64.tar.gz"
      sha256 "3cea06a5c9480d8f0cbbf661782eff862f662f7c3ad41f4d6c7a7a16c6206e6d"
    end
  end

  on_linux do
    url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.3/dbsync-safe-linux-x86_64.tar.gz"
    sha256 "f341ae5da98999cd41618d572b4c17042149df90dbc20a168e89865c8727fb91"
  end

  def install
    bin.install "dbsync-safe"
  end

  test do
    assert_match "dbsync-safe", shell_output("#{bin}/dbsync-safe --help")
  end
end
