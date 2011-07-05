var request = require('request'),
    sys = require('sys'),
    Crawler = require('../../node-crawler/lib/crawler.js').Crawler,
    fs = require("fs");
    
    //require("v8-profiler");

var debug = function(a) {sys.puts(JSON.stringify(a));};

var REST_TARGET = "http://ted-api.appspot.com/rest/v1/json/"; //http://localhost:8080/rest/v1/json/
var REST_TARGET_WRITE = "http://ted-api.appspot.com/auth/rest/v1/json/"; //http://localhost:8080/rest/v1/json/

var json = fs.readFileSync("../appengine/credentials.json", "utf-8"); 
var credentials = JSON.parse(json);

//Get the TEDTalks list
console.log("Fetching TED Talks...");
request({uri:'http://spreadsheets.google.com/feeds/list/0AsKzpC8gYBmTcGpHbFlILThBSzhmZkRhNm8yYllsWGc/od6/public/values?alt=json'}, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        talks = JSON.parse(body);
         
        console.log("Got "+talks.feed.entry.length+" TED Talks...");
        
        // Init the crawler
        var crawler = new Crawler({
            maxConnections:1,
            timeout:60,
            priorityRange:2,
            cache:false,
            skipDuplicates:false,
            priority:1,
            maxRetries:10,
            debug:true,
            jQuery:false,
        });
        
        
        var getKey = function(model,tedid,callback) {
            crawler.queue({
                "uri":REST_TARGET+model+"?feq_tedid="+encodeURIComponent(tedid),
                "priority":0,
                "callback":function(error,response) {
                    
                    if (error) {
                        callback(error);
                        console.log("ERROR",error);
                        return;
                    }
                    try {
                        
                        var ret = JSON.parse(response.content);

                        if (ret.list[model]) {
                            if (ret.list[model][0])
                                callback(null,ret.list[model][0].key);
                            else
                                callback(null,ret.list[model].key);
                        } else {
                            callback(null,false);
                        }
                    } catch (e) {
                        console.log("ERROR",e);
                        callback(e,false);
                    }
                    
                }
            });
        };
        
        var toBase64 = function(str) {
          return  (new Buffer(str || "", "ascii")).toString("base64");
        };
        
        var save=function(model,data,callback) {
            var obj = {"list":{}};
            obj.list[model]=[data];
            
            crawler.queue({
                "uri":REST_TARGET_WRITE+model,
                "method":"POST",
                "headers":{
                    "Content-Type":"application/json",
                    "Accept":"application/json",
                    "Authorization":"Basic "+toBase64("ted at josh:cest moi qui fait les regles!")
                },
                "body":JSON.stringify(obj),
                "priority":0,
                "callback":function(error,response) {
                    if (error) {
                        console.log("ERROR while submitting",model,error,response);
                        if (callback) callback(error);
                    } else {
                        data.key=response.content;
                        if (callback) callback(null,data);
                    }
                    
                }
            });
        }
        
        
        var submit=function(model,data,callback) {
            
            //Unique check
            if (data.tedid) {
                getKey(model,data.tedid,function(error,k) {
                    console.log("key for "+model+" "+data.tedid,k);
                    if (error) return callback(error);
                    if (k) {
                        data.key=k;
                    }
                    //todo might be possible to insert duplicates here (use a second crawler with next() support, and cache disabled to re-enalbe it in the main crawler)
                    save(model,data,callback);
                    
                    /*} else {
                        save(model,data,function(error,data) {
                            if (error) return callback(error);
                            getKey(model,data.tedid,function(error,k) {
                                if (error) return callback(error);
                                if (k) {
                                    data.key = k;
                                }
                                callback(null,data);
                            });
                        })
                    }*/
                    
                });
                
            } else {
                save(model,data,callback);
            }
            
        }
        
        talks.feed.entry.reverse();
        
        talks.feed.entry.forEach(function(talk_data) { 
            
            //Grab talk page on TED.com
            crawler.queue({
                "uri":"http://www.ted.com/talks/view/id/"+parseInt(talk_data.gsx$id.$t),
                "jQuery":true, 
                "priority":1,        
                "callback":function(error,response,$) {
                
                    if (error || !response.content) return console.log("ERROR",error);
                
                    //event
                    var event = {
                        "tedid":talk_data.gsx$event.$t,
                        "name":talk_data.gsx$event.$t
                    };
                
                    var seconds = 0;
                    (talk_data.gsx$duration.$t).split(":").forEach(function(n,i) {seconds+=Math.pow(60,2-i)*parseInt(n);});
                
                    var talk = {
                        "tedid":parseInt(talk_data.gsx$id.$t),
                        "name":talk_data.gsx$name.$t,
                        "shortsummary":talk_data.gsx$shortsummary.$t,
                        "date_published":"",
                        "duration":seconds
                    };
                    

                    talk.duration_intro = (response.content.match(/introDuration\:([0-9]+)/) || [0,0])[1];
                    talk.duration_ad = (response.content.match(/adDuration\:([0-9]+)/) || [0,0])[1];
                    talk.duration_postad = (response.content.match(/postAdDuration\:([0-9]+)/) || [0,0])[1];
                    
                    talk.tedidstr = response.request.uri; //TODO https://github.com/mikeal/request/issues/43 .match(new RegExp("http\\://www.ted.com/(index\.php/)?talks/(.*?).html"))[2];

                    $("head link[rel=image_src]").each(function(i,el){
                        talk.image = el.href;
                    });
                
                    submit("Event",event,function(error,event) {
                    
                        if (!$("a:contains(Full bio and more links)").length) {
                          console.warn("********************** http://www.ted.com/talks/view/id/"+parseInt(talk_data.gsx$id.$t)," HAS NO TALKER !");
                          return;
                        }
                    
                        var talker = {
                            "tedid":$("a:contains(Full bio and more links)")[0].href.match(new RegExp("/(index\.php/)?speakers/(.*?)\\.html"))[2],
                            "name":talk_data.gsx$speaker.$t
                        };
                        
                        talk.event=event.key;
                        
                        //Grab talker page on TED.com
                        crawler.queue({
                            "uri":"http://www.ted.com/speakers/"+talker.tedid+".html",
                            "jQuery":true,
                            "priority":0,
                            "callback":function(error,response,$talker) {
                        
                                if (error || !response.content) return console.log("ERROR",error);
                        
                                $talker("#speakerscontent img").each(function(i,el){
                                    talker.image = el.src;
                                });
                        
                                submit("Talker",talker,function(error,talker) {
                                    
                                    talk.talker = talker.key;
                                    
 
                                    submit("Talk",talk,function(error,talk) {


                                   /*
                                                                       $("select#languageCode option").each(function(i,el){
                                                                           var lang = {
                                                                               "idstr":el.value,
                                                                               "name":el.innerHTML
                                                                           };
                                                                           submit("Language",lang);

                                                                           //Get each transcript
                                                                           crawler.queue({"uri":"http://www.ted.com/talks/subtitles/id/"+talk.tedid+"/lang/"+lang.tedid,"priority":0,"callback":function(error,response) {
                                                                               var transcript={
                                                                                   "talk":talk.tedid,
                                                                                   "language":lang.tedid
                                                                               };
                                                                               submit("Transcript",transcript);

                                                                               //"captions":JSON.parse(response.content)["captions"],

                                                                           }});
                                                                       });
                                   */


                                        //themes
                                        $("ul.relatedThemes a").each(function(i,el){
                                            var theme={
                                                "tedid":el.href.match(new RegExp("/(index\.php/)?themes/(.*?)\\.html"))[2],
                                                "name":el.innerHTML
                                            };
                                            
                                            crawler.queue({
                                              "uri":"http://www.ted.com/themes/"+theme.tedid+".html",
                                              "jQuery":true,
                                              "priority":0,
                                              "callback":function(error,response,$theme) {
                                            
                                                if ($theme("#contextual .about div > img").size()) {
                                                  var image = $theme("#contextual .about div > img")[0].src;
                                                
                                                  submit("Theme",theme,function(error,theme) {
                                                      var talktheme = {
                                                          theme:theme.key,
                                                          talk:talk.key,
                                                          image:image
                                                      };
                                                      submit("TalkTheme",talktheme);
                                                  });
                                                }
                                              }
                                            });
                                            
                                            
                                        }); 

                                        //tags
                                        $("dd.tags a").each(function(i,el){
                                            console.log("tag href",el.href);
                                            var tag = {
                                                "tedid":el.href.match(new RegExp("/(index\.php/)?talks/tags/name/([A-Za-z0-9\+-]+)"))[2],
                                                "name":el.innerHTML
                                            };
                                            submit("Tag",tag,function(error,tag) {
                                                var talktag = {
                                                    tag:tag.key,
                                                    talk:talk.key
                                                };
                                                submit("TalkTag",talktag);
                                            });
                                        });
                                        

                                        var getVideo = function(e,q,cb) {
                                            var video = {
                                                "tedid":parseInt(e.href.match(new RegExp("/talks/download/video/([0-9]+)/talk/"+talk.tedid))[1]),
                                                "mimetype":"video/mp4",
                                                "talk":talk.key,
                                                "format":q
                                            };
                                            crawler.queue({"uri":"http://www.ted.com/talks/download/video/"+video.tedid+"/talk/"+talk.tedid,"method":"HEAD","priority":0,"callback":function(err,resp) {
                                                video.url = resp.request.uri;
                                                cb(video);
                                            }});
                                        };

                                        $("a:contains(Watch high-res video (MP4))").each(function(i,el){
                                            getVideo(el,"480",function(video) {
                                                submit("Video",video);
                                            });
                                        });

                                        $("a:contains(Download video to desktop (MP4))").each(function(i,el){
                                            getVideo(el,"240",function(video) {
                                                submit("Video",video);
                                            });
                                        });
                                        
                                        delete $;
                                        delete response;
                                        delete $talker;

                                    });

                                });
                        
                        }});
                        
                    });
                    
                
                }
            });
        });
    }
});
