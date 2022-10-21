/* üü
 * API login 1.4
 */

// var api_base_url = 'https://server50.sewobe.de/applikation/restlogin/api/';
var api_base_url = 'https://server50.sewobe.de/applikation/';
var api_mandant_key = '56df3cb35c66e55a62fa088ed7fa25d2';
var session_cookie_lifetime = 5;  // in minutes
var website_base_url = window.location.protocol + '//' + window.location.host;
var website_protected_pages = [
    '/members/dashboard', '/members/dashboard.php',
    '/members/change-password',
];

var debug = false;

/*
 * cookies:
 * dphg-session-id
 */
function create_cookie(name, value, minutes) {
    if (minutes) {
        var date = new Date();
        date.setTime(date.getTime() + (minutes * 60 * 1000));
        var expires = "; expires=" + date.toGMTString();
    } else {
        var expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function erase_cookie(name) {
    create_cookie(name, "", -1);
}

function get_cookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

/*
 * Documentation: https://api.sewobe.de/api/zugang/kp_check_session
 */
function check_session(event) {

    if (website_protected_pages.includes(window.location.pathname)) {
        if (debug) console.log("Protected page: " + window.location.pathname);
        if (debug) console.log("check_session()");

        var session_id = get_cookie('dphg-session-id');
        if (debug) console.log("Session-ID: " + session_id);

        if (session_id == undefined || session_id == null || session_id == "") {
            if (debug) console.log("Session-ID empty. You need to login.");
            // show_message('Login', 'Es besteht keine gültige Session. Bitte melden Sie sich an.');
            redirect();
        } else {

            $.ajax({
                type: 'POST',
                data: 'SESSION_CHECK=' + session_id,
                url: api_base_url + 'zugang/api/KP_CHECK_SESSION',
                success: function (data, textStatus) {
                    // console.log(data);
                    if (data['STATUSCODE'] && data['STATUSCODE'] == 1) {
                        if (debug) console.log("checked session successfully (" + session_id + ")!");
                        create_cookie('dphg-session-id', session_id, session_cookie_lifetime);
                        toggle_button_states('logged-in');
                        return true;
                    } else {
                        if (debug) console.log("Problem with Session-ID! Error: " + data['STATUS'] + ")!");
                        erase_cookie('dphg-session-id');
                        redirect();
                        return true;
                    }
                },
                error: function (result) {
                    if (debug) console.log('Error: Could not check session for SESSION ' + data["SESSION"] + '...<br>' + result);
                    return false;
                }
            });
        }
    } else {
        if (debug) console.log("Current page not protected... " + window.location.pathname);
    }
    event.preventDefault();
    return false;
}

function toggle_button_states(state) {
    if (state == 'logged-in') {
        if ($("#button-login").length) $("#button-login").hide();
        if ($("#button-logout").length) $("#button-logout").show();
    } else {
        if ($("#button-login").length) $("#button-login").show();
        if ($("#button-login").length) $("#button-logout").hide();
    }
}

function redirect(target, delay) {
    // console.log("redirect to target " + target);
    // var target_page = 'members';
    var target_page = "";

    if (delay == null) delay = 0;

    if (target == 'dashboard') {
        target_page = 'members/dashboard';
    }

    window.setTimeout(function () {
        window.location.replace(website_base_url + '/' + target_page);
    }, delay);

    return true;
}

/*
 * regex from: https://emailregex.com/
 */
function is_email(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  //  var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return regex.test(email);
}

/*
 * Explanation
 *  /^
 *    (?=.*\d)          // should contain at least one digit
 *    (?=.*[a-z])       // should contain at least one lower case
 *    (?=.*[A-Z])       // should contain at least one upper case
 *    [a-zA-Z0-9]{8,}   // should contain at least 8 from the mentioned characters
 *  $/
 */

function validate_new_password(new_password) {
    // var regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/;
    var regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
    var result = regex.test(new_password);
    console.log("new password result: " + result);
    return result;
}

$( document ).ready(function() {

    /*
     * documentation: https://api.sewobe.de/
    */
    if (debug) console.log("API login 1.4 ready...");

    var event = document.createEvent('Event');
    check_session(event);

    if ($("#button-login").length) {
        $("#button-login").click(function (event) {
            kp_login(event);
        });
    }
    if ($("#button-logout").length) {
        $("#button-logout").click(function (event) {
            kp_logout(event);
        });
    }
    if ($("#button-check-session").length) {
        $("#button-check-session").click(function (event) {
            check_session(event);
        });
    }
    if ($("#button-reset-password").length) {
        $("#button-reset-password").click(function (event) {
            kp_new_passwd(event);
        });
    }
    if ($("#button-change-password").length) {
        $("#button-change-password").click(function (event) {
            kp_change_passwd(event);
        });
    }

    /*
     * Documentation: https://api.sewobe.de/api/zugang/kp_login
    */
    function kp_login(event) {

        var username = $('#username').val();
        var password = $('#password').val();
        var login_data = 'UPORTAL=' + username + '&PWPORTAL=' + encodeURIComponent(password) + '&MANDANT_KEY=' + api_mandant_key;

        if (username == "") {
            $("#username").focus();
            show_message('Anmeldung', 'Bei der Anmeldung ist ein Fehler aufgetreten.<br />Feld E-Mail darf nicht leer sein.');
            event.preventDefault();
            return false;
        } else if ( is_email(username) == false) {
            $("#username").focus();
            show_message('Anmeldung', 'Die angegebene E-Mail-Adresse hat ein falsches Format.');
            event.preventDefault();
            return false;
        }
        if (password == "") {
            $("#password").focus();
            show_message('Anmeldung', 'Bei der Anmeldung ist ein Fehler aufgetreten.<br />Feld Passwort darf nicht leer sein.');
            event.preventDefault();
            return false;
        }

        if (debug) console.log("username: " + username);
        if (debug) console.log("password: " + password);
        if (debug) console.log("login_data: " + login_data);

        $.ajax({
            url: api_base_url + 'zugang/api/KP_LOGIN',
            type: 'POST',
            data: login_data,
            success: function (data, textStatus) {
                if (debug) {
                    console.log("Login successful.");
                    console.log("textStatus: " + textStatus);

                    console.log("data['STATUSCODE']: " + data['STATUSCODE']);
                    console.log("data['STATUS']: " + data['STATUS']);
                    console.log("data['SESSION']: " + data['SESSION']);
                    console.log("data['USERNAME']: "+ data['USERNAME']);
                    console.log("data['HSADR_ID']: "+ data['HSADR_ID']);
                    console.log("data['KUNDEN_ID']: "+ data['KUNDEN_ID']);
                }
                // alert("test: " + data['STATUSCODE']);
                if (data['STATUSCODE'] === 1) {
                    if (data['SESSION'] !== null) {
                        create_cookie('dphg-session-id', data['SESSION'], session_cookie_lifetime);
                        toggle_button_states('logged-in');
                        show_message('Anmeldung', 'Ihre Anmeldung war erfolgreich.');
                        redirect('dashboard', 1000);
                        return true;
                    } else {
                        if (debug) console.log('Error during login! No session available!');
                        show_message('Anmeldung', 'Bei der Anmeldung ist ein Fehler aufgetreten. Es konnte keine Session erstellt werden.');
                        return false;
                    }
                    toggle_button_states('logged-in');
                    show_message('Anmeldung', 'Ihre Anmeldung war erfolgreich.');
                } else if (data['STATUSCODE'] === -3) {
                    if (debug) console.log('Error during login! No session available! Wrong user or password.');
                    show_message('Anmeldung', 'Bei der Anmeldung ist ein Fehler aufgetreten.<br />' + data['STATUS']);
                    return false;
                } else {
                    if (debug) console.log('Error during login! No session available!');
                    show_message('Anmeldung', 'Bei der Anmeldung ist ein Fehler aufgetreten. Es konnte keine Session erstellt werden.');
                    return false;
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                if (debug) {
                    console.log('Error logging in.');
                    console.log(xhr);
                    console.log(xhr.status);
                    console.log(xhr.responseText);
                    console.log(thrownError);
                }
                var response = $.parseJSON(xhr.responseText);
                show_message('Anmeldung', 'Bei der Anmeldung ist folgender Fehler aufgetreten:<br>' + response.ERROR);
                return false;
            }
        });
        event.preventDefault();
        return false;
    }

    /*
     * Documentation: https://api.sewobe.de/api/zugang/kp_logout
     */
    function kp_logout(event) {

        var session_id = get_cookie('dphg-session-id');

        if (session_id !== null) {
            $.ajax({
                type: 'POST',
                data: 'SESSION_ZUGANG=' + session_id,
                url: api_base_url + 'zugang/api/KP_LOGOUT',
                success : function(data, textStatus){
                    // console.log("STATUSCODE: " + data['STATUSCODE']);
                    if (data['STATUSCODE'] && data['STATUSCODE'] == 1) {
                        if (debug) console.log("logged out successfully!");
                        show_message('Abmeldung', 'Sie wurden erfolgreich abgemeldet.');
                        erase_cookie('dphg-session-id');
                        toggle_button_states('logged_out');
                        redirect('', 1000);
                        return true;
                    }
                },
                error: function(result) {
                    if (debug) console.log('Undefined error while logging out!');
                    if (debug) console.log(result);
                    show_message('Abmeldung', 'Bei der Abmeldung ist ein unbekannter Fehler aufgetreten.');
                    return false;
                }
            });
        }
        event.preventDefault();
        return false;
    }

    /*
     * a.k.a password reset
     * Documentation: https://api.sewobe.de/api/zugang/kp_new_passwd
     */
    function kp_new_passwd(event) {

        var email = $("#email").val();

        if ( email == null || email == undefined ) {
            show_message('Passwort zurücksetzen','Fehler: Bitte geben Sie eine E-Mail-Adresse ein.');
            event.preventDefault();
            return false;
        } else if ( is_email(email) == false ) {
            show_message('Passwort zurücksetzen','Fehler: Die eingegebene E-Mail-Adresse hat ein ungültiges Format.');
            event.preventDefault();
            return false;
        } else {

            $.ajax({
                url: api_base_url + 'zugang/api/KP_NEW_PASSWD',
                type: 'POST',
                data: 'EMAIL=' + email + '&MODE=0',
                success: function (data, textStatus) {
                    if ( debug) console.log("textStatus: " + textStatus);
                    if ( debug) console.log("data['STATUSCODE']: " + data['STATUSCODE']);
                    if ( debug) console.log("data['STATUS']: " + data['STATUS']);

                    if (data['STATUSCODE'] == 1) {
                        if ( debug ) console.log('Password reset successfull.');
                        show_message('Passwort zurücksetzen', 'Ihre Anfrage zum Zurücksetzen des Passworts war erfolgreich.<br /><br />Wir senden Ihnen ein neues Passwort.<br /><br />Bitte prüfen Sie Ihr E-Mail-Postfach und ggfls. auch den SPAM-Ordner.');
						if ($("#email").length) {
                        	if ( debug ) console.log("resetting field email to empty.");
                        	$("#email").val("");
                        }
                        return true;
                    } else {
                        if ( debug ) console.log('Password reset NOT successfull! Error: ' + data['STATUS'] );
                        show_message('Passwort zurücksetzen', 'Beim Zurücksetzen des Passworts ist folgender Fehler aufgetreten:<br>' + data['STATUS']);
                        return false;
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    if (debug) {
                        console.log('Error resetting password in.');
                        console.log(xhr.status);
                        console.log(xhr.responseText);
                        console.log(thrownError);
                    }
                    var response = $.parseJSON(xhr.responseText);
                    show_message('Passwort zurücksetzen', 'Beim Zurücksetzen des Passworts ist folgender Fehler aufgetreten:<br>' + response.ERROR);
                    return false;
                }
            });
        }
        event.preventDefault();
        return false;
    }

    /*
     * a.k.a change password
     * Documentation: https://api.sewobe.de/api/zugang/kp_change_passwd
    */
    function kp_change_passwd(event) {

        var password_old = $("#password-old").val();
        var password_new = $("#password-new").val();
        var password_new_confirm = $("#password-new-confirm").val();
        var session_id = get_cookie('dphg-session-id');

        if (password_old == false) {
            if ( debug ) console.log("Error change pw: #password-old is empty!")
            show_message('neues Passwort vergeben', 'Fehler: Das Feld "aktuelles Passwort" darf nicht leer sein.');
        } else if (password_new == false) {
            if ( debug ) console.log("Error change pw: #password-new is empty!")
            show_message('neues Passwort vergeben', 'Fehler: Das Feld "neues Passwort" darf nicht leer sein.');
        } else if (password_new_confirm == false) {
            if ( debug ) console.log("Error change pw: #password-new-confirm is empty!")
            show_message('neues Passwort vergeben', 'Fehler: Das Feld "neues Passwort (Wiederholung)" darf nicht leer sein.');
        } else if (password_new != password_new_confirm) {
            if ( debug ) console.log("Error change pw: #password-new differs from #password-new-confirm!")
            show_message('neues Passwort vergeben', 'Fehler: Die Eingaben in den Feldern "neues Passwort" und "neues Passwort (Wiederholung)" sind nicht identisch.');
        } else if (validate_new_password(password_new) === false) {
            if ( debug ) console.log("Error change pw: New password does not match criteria.");
            show_message('neues Passwort vergeben', 'Fehler: Das neue Passwort entspricht nicht den Anforderungen.');
        } else if (validate_new_password(password_new) === true) {

            $.ajax({
                url: api_base_url + 'zugang/api/KP_CHANGE_PASSWD',
                type: 'POST',
                data: 'SESSION_ZUGANG=' + session_id + '&PASSWORT_ALT=' + password_old +'&PASSWORT_NEU=' + password_new + '&PASSWORT_NEUWD=' + password_new_confirm,
                success: function (data, textStatus) {
                    if ( debug) console.log("textStatus: " + textStatus);
                    if ( debug) console.log("data['STATUSCODE']: " + data['STATUSCODE']);
                    if ( debug) console.log("data['STATUS']: " + data['STATUS']);

                    if (data['STATUSCODE'] == 1) {
                        if ( debug ) console.log('Password reset successfull.');
                        show_message('Passwort ändern', 'Ihr Passwort wurde erfolgreich geändert.');                      
                        return false;
                    } else {
                        if ( debug ) console.log('Password reset NOT successfull! Error: ' + data['STATUS'] );
                        show_message('Passwort zurücksetzen', 'Beim Zurücksetzen des Passworts ist folgender Fehler aufgetreten:<br>' + data['STATUS']);
                        return false;
                    }
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    if (debug) {
                        console.log('Error resetting password in.');
                        console.log(xhr.status);
                        console.log(xhr.responseText);
                        console.log(thrownError);
                    }
                    var response = $.parseJSON(xhr.responseText);
                    show_message('Passwort zurücksetzen', 'Beim Zurücksetzen des Passworts ist folgender Fehler aufgetreten:<br>' + response.ERROR);
                    return false;
                }
            });


        } else {
            if ( debug ) console.log("Error change pw: An unknown error occurred.")
            show_message('neues Passwort vergeben', 'Fehler: Bei der Änderung des Passworts ist ein unbekannter Fehler aufgetreten.');
        }
        event.preventDefault();
        return false;
    }




    function show_message(title, message) {
        if (title == "" || title == null || title == undefined )
            title = 'Hinweis';
        if (message == "" || message == null || message == undefined )
            title = 'Ein unbekannter Fehler ist aufgetreten.';
        $(".messages .subheading").html(title);
        $(".messages .message-content").html(message);
        $(".messages").removeClass("hidden-global");
        return true;
    }

});
