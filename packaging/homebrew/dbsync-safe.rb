class DbsyncSafe < Formula
  desc "Make verified SQLite snapshots before file sync"
  homepage "https://db-file-sync-safety.sociobot.in"
  version "0.1.2"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.2/dbsync-safe-macos-aarch64.tar.gz"
      sha256 "54b4ac4478d00568e65487c303e74a8838d0738bc09494c5c0c239e282075108"
    else
      url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.2/dbsync-safe-macos-x86_64.tar.gz"
      sha256 "9c5febe8573c78a695b8095430f4b7cb7fc88af08e11a98fe6d45ce55cf2387a"
    end
  end

  on_linux do
    url "https://github.com/B-Divyesh/sf-db-file-sync-safety/releases/download/v0.1.2/dbsync-safe-linux-x86_64.tar.gz"
    sha256 "af8b4a7627a6b69dcc123524cdb330fcd4e37841e45c034757011bc7534625e7"
  end

  def install
    bin.install "dbsync-safe"
  end

  test do
    assert_match "dbsync-safe", shell_output("#{bin}/dbsync-safe --help")
  end
end
