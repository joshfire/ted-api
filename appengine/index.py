import rest

from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

import models
import auth
import logging

from django.utils import simplejson


class JSONDispatcher(rest.Dispatcher):
    content_type_order = [rest.JSON_CONTENT_TYPE]
    base_url="/rest/v1/json"
    model_handlers = {}
    
class JSONAuthDispatcher(rest.Dispatcher):
    content_type_order = [rest.JSON_CONTENT_TYPE]
    base_url="/auth/rest/v1/json"
    authenticator = auth.BasicAuthenticator()
    model_handlers = {}
    
class XMLDispatcher(rest.Dispatcher):
    content_type_order = [rest.XML_CONTENT_TYPE]
    base_url="/rest/v1/xml"
    model_handlers = {}
  
logging.info((JSONDispatcher,XMLDispatcher))

JSONDispatcher.add_models_from_module(models,model_methods=['GET_METADATA', 'GET'])

XMLDispatcher.add_models_from_module(models,model_methods=['GET_METADATA', 'GET'])

JSONAuthDispatcher.add_models_from_module(models)
 

  
application = webapp.WSGIApplication([
    ('/auth/rest/v1/json/.*', JSONAuthDispatcher),
    ('/rest/v1/json/.*', JSONDispatcher),
    ('/rest/v1/xml/.*', XMLDispatcher)
],debug=True)

def main():

    run_wsgi_app(application)
    
if __name__ == "__main__":
    main()