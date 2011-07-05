import rest
import logging
import base64


import json

credentials = json.load("credentials.json")

AUTHENTICATE_HEADER = "WWW-Authenticate"
AUTHORIZATION_HEADER = "Authorization"
AUTHENTICATE_TYPE = 'Basic realm="Secure Area"'
CONTENT_TYPE_HEADER = "Content-Type"
HTML_CONTENT_TYPE = "text/html"

class BasicAuthenticator(rest.Authenticator):
    """Example implementation of HTTP Basic Auth."""

    def __init__(self):
        super(BasicAuthenticator, self).__init__()

    def authenticate(self, dispatcher):

        user_arg = None
        pass_arg = None
        try:
            # Parse the header to extract a user/password combo.
            # We're expecting something like "Basic XZxgZRTpbjpvcGVuIHYlc4FkZQ=="
            auth_header = dispatcher.request.headers[AUTHORIZATION_HEADER]

            # Isolate the encoded user/passwd and decode it
            auth_parts = auth_header.split(' ')
            user_pass_parts = base64.b64decode(auth_parts[1]).split(':')
            user_arg = user_pass_parts[0]
            pass_arg = user_pass_parts[1]

        except Exception:
            # set the headers requesting the browser to prompt for a user/password:
            dispatcher.response.set_status(401, message="Authentication Required")
            dispatcher.response.headers[AUTHENTICATE_HEADER] = AUTHENTICATE_TYPE
            dispatcher.response.headers[CONTENT_TYPE_HEADER] = HTML_CONTENT_TYPE

            dispatcher.response.out.write("<html><body>401 Authentication Required</body></html>")
            raise rest.DispatcherException()

        if user_arg==credentials["USER"] and pass_arg==credentials["PASS"]:
            return
            
        dispatcher.forbidden()