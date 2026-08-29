class DbsyncSafe < Formula
  desc "Make verified SQLite snapshots before file sync"
  homepage "https://db-file-sync-safety.sociobot.in"
  version "0.1.1"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.1/dbsync-safe-macos-aarch64.tar.gz"
      sha256 "44dd7f6649f8570014ec7d0ad6635023497343819a9811682757b7547f1aff2b"
    else
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.1/dbsync-safe-macos-x86_64.tar.gz"
      sha256 "bafc5a3ba5dd41fee34648267acb0bc10d33b6bd4d78e0c290f1387f73e425e2"
    end
  end

  on_linux do
    url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.1/dbsync-safe-linux-x86_64.tar.gz"
    sha256 "7e75a6a40cec4ca0dcf24632215088cec272bf7093db5999f157484df58467fa"
  end

  def install
    bin.install "dbsync-safe"
  end

  test do
    assert_match "dbsync-safe", shell_output("#{bin}/dbsync-safe --help")
  end
end
