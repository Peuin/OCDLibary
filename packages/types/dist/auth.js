"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningMethod = exports.OidcErrorCode = exports.AuthenticationMethod = exports.LoginErrorCode = void 0;
var LoginErrorCode;
(function (LoginErrorCode) {
    LoginErrorCode["ACCOUNT_LOCKED"] = "account_locked";
    LoginErrorCode["PASSWORD_AUTH_DISABLED"] = "password_auth_disabled";
})(LoginErrorCode || (exports.LoginErrorCode = LoginErrorCode = {}));
exports.AuthenticationMethod = {
    Password: "password",
    Oidc: "oidc",
    MagicLink: "magic_link",
    Setup: "setup",
    Legacy: "legacy",
};
var OidcErrorCode;
(function (OidcErrorCode) {
    OidcErrorCode["STATE_EXPIRED"] = "oidc_state_expired";
    OidcErrorCode["PRIVATE_ISSUER_ADDRESS"] = "oidc_private_issuer_address";
    OidcErrorCode["TLS_CERTIFICATE_UNTRUSTED"] = "oidc_tls_certificate_untrusted";
    OidcErrorCode["TOKEN_EXCHANGE_FAILED"] = "oidc_token_exchange_failed";
    OidcErrorCode["USER_NOT_PROVISIONED"] = "oidc_user_not_provisioned";
    OidcErrorCode["USER_INACTIVE"] = "oidc_user_inactive";
    OidcErrorCode["PROVIDER_ERROR"] = "oidc_provider_error";
})(OidcErrorCode || (exports.OidcErrorCode = OidcErrorCode = {}));
exports.ProvisioningMethod = {
    Local: "local",
    Manual: "manual",
    Oidc: "oidc",
    Shared: "shared",
};
