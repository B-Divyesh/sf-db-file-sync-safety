class DbsyncSafe < Formula
  desc "Make verified SQLite snapshots before file sync"
  homepage "https://db-file-sync-safety.sociobot.in"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.0/dbsync-safe-macos-aarch64.tar.gz"
      sha256 "9ccfd0b4dc46a8f26aec560681ee71bfbdd77a70d96e98663db728af02731944"
    else
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.0/dbsync-safe-macos-x86_64.tar.gz"
      sha256 "724843da739b27e19d61e9a1aabf13f30686b320f9d00cc42d98a00a8238075d"
    end
  end

  on_linux do
    url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.0/dbsync-safe-linux-x86_64.tar.gz"
    sha256 "dbc74bedea6eed268092dc707bc306519b45300166af1091c3632c90e4bda5a2"
  end

  def install
    bin.install "dbsync-safe"
  end

  test do
    assert_match "dbsync-safe", shell_output("#{bin}/dbsync-safe --help")
  end
end
