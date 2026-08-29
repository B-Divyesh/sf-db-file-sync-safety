#define _GNU_SOURCE
#include <arpa/inet.h>
#include <errno.h>
#include <fcntl.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/syscall.h>
#include <sys/types.h>
#include <unistd.h>

static void audit_line(const char *kind, long value, const char *detail) {
  const char *log_path = getenv("DBSYNC_SAFE_AUDIT_LOG");
  if (!log_path || !detail || strcmp(detail, log_path) == 0) return;
  int fd = (int)syscall(SYS_openat, AT_FDCWD, log_path, O_WRONLY | O_CREAT | O_APPEND, 0600);
  if (fd < 0) return;
  char line[4096];
  int length = snprintf(line, sizeof(line), "%s\t%ld\t%s\n", kind, value, detail);
  if (length > 0) syscall(SYS_write, fd, line, (size_t)length);
  syscall(SYS_close, fd);
}

static mode_t creation_mode(int flags, va_list arguments) {
  return (flags & O_CREAT) ? (mode_t)va_arg(arguments, int) : 0;
}

int open(const char *path, int flags, ...) {
  va_list arguments;
  va_start(arguments, flags);
  mode_t mode = creation_mode(flags, arguments);
  va_end(arguments);
  audit_line("OPEN", flags, path);
  return (int)syscall(SYS_openat, AT_FDCWD, path, flags, mode);
}

int open64(const char *path, int flags, ...) {
  va_list arguments;
  va_start(arguments, flags);
  mode_t mode = creation_mode(flags, arguments);
  va_end(arguments);
  audit_line("OPEN", flags, path);
  return (int)syscall(SYS_openat, AT_FDCWD, path, flags, mode);
}

int openat(int directory, const char *path, int flags, ...) {
  va_list arguments;
  va_start(arguments, flags);
  mode_t mode = creation_mode(flags, arguments);
  va_end(arguments);
  audit_line("OPENAT", flags, path);
  return (int)syscall(SYS_openat, directory, path, flags, mode);
}

int openat64(int directory, const char *path, int flags, ...) {
  va_list arguments;
  va_start(arguments, flags);
  mode_t mode = creation_mode(flags, arguments);
  va_end(arguments);
  audit_line("OPENAT", flags, path);
  return (int)syscall(SYS_openat, directory, path, flags, mode);
}

int socket(int domain, int type, int protocol) {
  if (domain == AF_INET || domain == AF_INET6) {
    audit_line("NETWORK", domain, "socket");
    errno = EPERM;
    return -1;
  }
  return (int)syscall(SYS_socket, domain, type, protocol);
}

int connect(int socket_fd, const struct sockaddr *address, socklen_t length) {
  if (address && (address->sa_family == AF_INET || address->sa_family == AF_INET6)) {
    audit_line("NETWORK", address->sa_family, "connect");
    errno = EPERM;
    return -1;
  }
  return (int)syscall(SYS_connect, socket_fd, address, length);
}
