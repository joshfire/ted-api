import rest

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

import models
import auth

from django.utils import simplejson

rest.Dispatcher.add_models_from_module(models)

class JSONDispatcher(rest.Dispatcher):
    content_type_order = [rest.JSON_CONTENT_TYPE]
    base_url="/rest/v1/json"
    authenticator = auth.BasicAuthenticator()

class XMLDispatcher(rest.Dispatcher):
    content_type_order = [rest.XML_CONTENT_TYPE]
    base_url="/rest/v1/xml"
    authenticator = auth.BasicAuthenticator()
  
  
application = webapp.WSGIApplication([
    ('/rest/v1/json/.*', JSONDispatcher),
    ('/rest/v1/xml/.*', XMLDispatcher)
],debug=True)

def main():

    run_wsgi_app(application)
    
if __name__ == "__main__":
    main()