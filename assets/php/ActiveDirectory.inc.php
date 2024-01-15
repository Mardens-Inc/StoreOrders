<?php

function login($username, $password)
{
    // Active Directory server details
    $ldapServer = "ldap://192.168.21.215";
    // $ldapBaseDn = "DC=mss,DC=local";
    $ldapUsername = $username . "@mss.local"; // Use the user's full AD username

    // Connect to Active Directory
    $ldapConn = ldap_connect($ldapServer);
    ldap_set_option($ldapConn, LDAP_OPT_PROTOCOL_VERSION, 3);
    ldap_set_option($ldapConn, LDAP_OPT_REFERRALS, 0);

    if ($ldapConn) {
        // Bind to Active Directory using the provided username and password
        $ldapBind = ldap_bind($ldapConn, $ldapUsername, $password);

        if ($ldapBind) {
            // Authentication successful
            ldap_unbind($ldapConn);
            return true;
        } else {
            // Authentication failed
            ldap_unbind($ldapConn);
            return false;
        }
    } else {
        // Unable to connect to Active Directory
        return false;
    }
}
