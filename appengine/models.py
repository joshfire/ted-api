from google.appengine.ext import db

class Talker(db.Model):
    idstr = db.StringProperty(required=True)
    name = db.StringProperty(required=True)
    image = db.StringProperty()

class Event(db.Model):
    idstr = db.StringProperty(required=True)
    name = db.StringProperty(required=True)
    date_start = db.DateProperty()
    date_end = db.DateProperty()

class Theme(db.Model):
    idstr = db.StringProperty(required=True)
    name = db.StringProperty(required=True)

class Tag(db.Model):
    id = db.IntegerProperty(required=True)
    name = db.StringProperty(required=True)


class Talk(db.Model):
    id = db.IntegerProperty(required=True)
    idstr = db.StringProperty(required=True)
    name = db.StringProperty(required=True)
    date_published = db.DateProperty()
    shortsummary = db.TextProperty(required=True)
    duration = db.IntegerProperty(required=True)
    image = db.StringProperty(required=True)
    duration_intro = db.IntegerProperty(required=True)
    duration_ad = db.IntegerProperty(required=True)
    duration_postad = db.IntegerProperty(required=True)
    
    talker = db.ReferenceProperty(Talker)
    event = db.ReferenceProperty(Event)
    themes = db.ListProperty(db.Key)
    tags = db.ListProperty(db.Key)
    

class Video(db.Model):
    id = db.IntegerProperty(required=True)
    mimetype = db.StringProperty(required=True)
    format = db.StringProperty(required=True)
    
    talk = db.ReferenceProperty(Talk)
    
class Lang(db.Model):
    idstr = db.StringProperty(required=True)
    name = db.StringProperty(required=True)

class Transcript(db.Model):
    lang = db.ReferenceProperty(Lang)
    talk = db.ReferenceProperty(Talk)

class Caption(db.Model):
    content = db.StringProperty(required=True)
    starttime = db.IntegerProperty(required=True)
    duration = db.IntegerProperty(required=True)
    startofparagraph = db.BooleanProperty(required=True)
    
    transcript = db.ReferenceProperty(Transcript)
