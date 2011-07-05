from google.appengine.ext import db

class Talker(db.Model):
    tedid = db.StringProperty()
    name = db.StringProperty(required=True)
    image = db.StringProperty()

class Event(db.Model):
    tedid = db.StringProperty()
    name = db.StringProperty(required=True)
    date_start = db.DateProperty()
    date_end = db.DateProperty()

class Theme(db.Model):
    tedid = db.StringProperty(required=True)
    name = db.StringProperty(required=True)

class Tag(db.Model):
    tedid = db.StringProperty(required=True)
    name = db.StringProperty(required=True)
    image = db.StringProperty(required=True)

class Talk(db.Model):
    tedid = db.IntegerProperty()
    tedidstr = db.StringProperty(required=True)
    name = db.StringProperty(required=True)
    date_published = db.DateProperty()
    shortsummary = db.TextProperty(required=True)
    duration = db.IntegerProperty(required=True)
    image = db.StringProperty(required=True)
    duration_intro = db.IntegerProperty(required=True)
    duration_ad = db.IntegerProperty(required=True)
    duration_postad = db.IntegerProperty(required=True)
    
    talker = db.ReferenceProperty(Talker,required=True)
    event = db.ReferenceProperty(Event,required=True)
    
    
class TalkTheme(db.Model):
    talk = db.ReferenceProperty(Talk,required=True)
    theme = db.ReferenceProperty(Theme,required=True)
    
class TalkTag(db.Model):
    talk = db.ReferenceProperty(Talk,required=True)
    tag = db.ReferenceProperty(Tag,required=True)


class Video(db.Model):
    tedid = db.IntegerProperty()
    mimetype = db.StringProperty(required=True)
    format = db.StringProperty(required=True)
    url = db.StringProperty(required=True)
    
    
    talk = db.ReferenceProperty(Talk,required=True)
    
class Language(db.Model):
    tedid = db.StringProperty(required=True)
    name = db.StringProperty(required=True)

class Transcript(db.Model):
    tedid = db.StringProperty(required=True)
    language = db.ReferenceProperty(Language)
    talk = db.ReferenceProperty(Talk,required=True)

class Caption(db.Model):
    content = db.StringProperty(required=True)
    starttime = db.IntegerProperty(required=True)
    duration = db.IntegerProperty(required=True)
    startofparagraph = db.BooleanProperty(required=True)
    
    transcript = db.ReferenceProperty(Transcript,required=True)
