package com.template.app.security;

public final class UserContextHolder {

    private static final ThreadLocal<UserPrincipal> CURRENT_USER = new ThreadLocal<>();

    private UserContextHolder() {}

    public static void set(UserPrincipal principal) {
        CURRENT_USER.set(principal);
    }

    public static UserPrincipal get() {
        return CURRENT_USER.get();
    }

    public static Long getCurrentUserId() {
        UserPrincipal principal = get();
        return principal != null ? principal.getId() : null;
    }

    public static String getCurrentUsername() {
        UserPrincipal principal = get();
        return principal != null ? principal.getUsername() : null;
    }

    public static boolean isSuperAdmin() {
        UserPrincipal principal = get();
        return principal != null && principal.isSuperAdmin();
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
