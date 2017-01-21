console.log("The BOT is starting");

const Twit = require("twit");
const emoji = require('node-emoji');
const base64 = require('node-base64-image');
const xmlParseString = require('xml2js').parseString;
const http = require('http');
const download = require('download-file');
const config = require("./config");

const T = new Twit(config);
const urlXml = "http://thecatapi.com/api/images/get?format=xml&type=gif";
const woeid = 23424846;


//
// Function to convert XML to JSON
//
function xmlToJson(url, callback) {
   var req = http.get(url, function(res) {
      var xml = '';

      res.on('data', function(chunk) {
         xml += chunk;
      });

      res.on('error', function(e) {
         callback(e, null);
      });

      res.on('timeout', function(e) {
         callback(e, null);
      });

      res.on('end', function() {
         xmlParseString(xml, function(err, result) {
            callback(null, result);
         });
      });
   });
}

//
//  Function For Post Tweet With Image
//
function tweetItWithImageFromUrl(url, text) {

   console.log('Uploading Image...');

   var options = {string: true};

   base64.encode(url, options, function (err, b64image) {
      if (err) {
         console.log(err);
         letsGetStarted();
      } else {
         T.post('media/upload', { media_data: b64image }, function(err, data, response) {

            // now we can assign alt text to the media, for use by screen readers and
            // other text-based presentations and interpreters
            var mediaIdStr = data.media_id_string;
            var altText = "Small flowers in a planter on a sunny balcony, blossoming.";
            var meta_params = { media_id: mediaIdStr, alt_text: { text: altText }};

            T.post('media/metadata/create', meta_params, function (err, data, response) {
               if (!err) {
                  // Find Wordwide Trends
                  T.get('trends/place', { id : 	woeid }, function(err, data, response) {
                     var trending = data[0].trends;

                     // now we can reference the media and post a tweet (media will attach to the tweet)
                     // var params = { status: text+"\n\n"+trending[0].name+" "+trending[1].name+" "+trending[2].name, media_ids: [mediaIdStr] };
                     var params = { status: text, media_ids: [mediaIdStr] };

                     T.post('statuses/update', params, function (err, data, response) {
                        console.log(data);
                        letsGetStarted();
                     })
                  })

               } else {
                  console.log(err);
                  letsGetStarted();
               }
            });
         });
      }
   });
}

//
//  Function For Post Tweet With Gif
//
function tweetItWithGif(text) {

   console.log('Uploading Media...');

   var filePath = './files/image.gif';

   T.postMediaChunked({ file_path: filePath }, function (err, data, response) {
      console.log(data);
      // now we can assign alt text to the media, for use by screen readers and
      // other text-based presentations and interpreters
      var mediaIdStr = data.media_id_string;
      var altText = "Small flowers in a planter on a sunny balcony, blossoming.";
      var meta_params = { media_id: mediaIdStr, alt_text: { text: altText }};

      T.post('media/metadata/create', meta_params, function (err, data, response) {
         if (!err) {
            // Find Wordwide Trends
            T.get('trends/place', { id : 	woeid }, function(err, data, response) {
               var trending = data[0].trends;

               // for (var i = 0; i < trending.length; i++) {
               //    console.log("--"+trending[i].name);
               // }

               // now we can reference the media and post a tweet (media will attach to the tweet)
               // var params = { status: text+"\n\n"+trending[0].name+" "+trending[1].name+" "+trending[2].name, media_ids: [mediaIdStr] };
               var params = { status: text, media_ids: [mediaIdStr] };

               T.post('statuses/update', params, function (err, data, response) {
                  console.log(data);
               })
            })

         } else {
            console.log(err);
            letsGetStarted();
         }
      });
   });
}

//  Setting up a user stream
var stream = T.stream('user')

// Anytime someone follows me
stream.on('follow', function (event) {
   var name = event.source.name;
   var screenName = event.source.screen_name;
   if (screenName!="kitten_evriday") {
      tweetItWithImageFromUrl('https://lh6.ggpht.com/sw_iT7GZASdAYeiecsZEHJE-EgDhdK2rCWUzZOJS0OFiGpoi9qn8iMH2nuXHgWg2PA=h900', ".@"+screenName + " Hi, "+name+", Thx for following me.. "+ emoji.emojify(':heart: :heart:'));
   }
});

function letsGetStarted() {
   xmlToJson(urlXml, function(err, data) {
      if (err) {
         // Handle this however you like
         return console.err(err);
         letsGetStarted();
      }

      // Do whatever you want with the data here
      // Following just pretty-prints the object
      var dataConverted = JSON.stringify(data, null, 2);
      var JsonDataconverted = JSON.parse(dataConverted);
      console.log(dataConverted);
      var imageUrl = JsonDataconverted.response.data[0].images[0].image[0].url[0];
      var sourceUrl = JsonDataconverted.response.data[0].images[0].image[0].source_url[0];
      var imageType = imageUrl.substr(imageUrl.length - 3);

      if (imageType=="gif") {
         var options = {
            directory: "./files/",
            filename: "image.gif"
         };

         download(imageUrl, options, function(err){
            if (err) {
               console.log(err);
               letsGetStarted();
            } else{
               console.log("yahoo!");
               tweetItWithGif("#kittenevriday #kitten #cat #cute "+ emoji.emojify(':heart: :heart:')+"\n\n\n\n\nsource : "+imageUrl);
            }
         });
      } else {
         tweetItWithImageFromUrl(imageUrl, "#kittenevriday #kitten #cat #cute "+ emoji.emojify(':heart: :heart:')+"\n\n\n\n\nsource : "+imageUrl);
      }
   });
}

letsGetStarted();

setInterval(function() {
   letsGetStarted();
}, 1000*60*60);
