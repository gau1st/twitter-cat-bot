console.log("The BOT is starting");

const Twit = require("twit");
const exec = require("child_process").exec;
const fs = require("fs");
const image_downloader = require('image-downloader');
const emoji = require('node-emoji');
const base64 = require('node-base64-image');
const http = require('http');
const xmlParseString = require('xml2js').parseString;
const config = require("./config");

var T = new Twit(config);
var urlXml = "http://thecatapi.com/api/images/get?format=xml&type=jpg,png";


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
      } else {
         T.post('media/upload', { media_data: b64image }, function(err, data, response) {

            // now we can assign alt text to the media, for use by screen readers and
            // other text-based presentations and interpreters
            var mediaIdStr = data.media_id_string;
            var altText = "Small flowers in a planter on a sunny balcony, blossoming.";
            var meta_params = { media_id: mediaIdStr, alt_text: { text: altText }};

            T.post('media/metadata/create', meta_params, function (err, data, response) {
               if (!err) {
                  var woeiid = 	23424846;
                  // Find Wordwide Trends
                  T.get('trends/place', { id : 	woeiid }, function(err, data, response) {
                     var trending = data[0].trends;

                     // now we can reference the media and post a tweet (media will attach to the tweet)
                     var params = { status: text+"\n\n"+trending[0].name, media_ids: [mediaIdStr] };

                     T.post('statuses/update', params, function (err, data, response) {
                        console.log(data);
                     })
                  })

               } else {
                  console.log(err);
               }
            });
         });
      }
   });
}


//
//  Function For Post Tweet With Image
//
// function tweetItWithImageFromUrl(url, text) {
//    console.log('Downloading Image...');
//    // Download to a directory and save with an another filename
//    var options = {
//        url: url,
//        dest: 'images/image.jpg',
//        done: function(err, filename, image) {
//            if (err) {
//              console.log(err);
//            } else {
//              console.log('File saved to', filename);
//              tweetItWithImage('images/image.jpg', text);
//            }
//        },
//    };
//    image_downloader(options);
// }

// var params = {
//    id : 23424846
// }

//
//  Function For Post Tweet
//
// function tweetIt(text) {
//    var r = Math.floor(Math.random()*100);
//    T.post('statuses/update', { status: text + " -- : " + r }, function(err, data, response) {
//       if (err) {
//          console.log("Something Went Wrong...");
//       } else {
//          console.log("Posted!!!")
//       }
//    })
// }

// //
// //  Function For Post Tweet With Trending
// //
// function tweetItWithTrending(text) {
//    var r = Math.floor(Math.random()*100);
//    //
//    //  search twitter for all tweets containing the word 'banana' since July 11, 2011
//    //
//    T.get('trends/place', params, function(err, data, response) {
//       var trending = data[0].trends;
//       for (var i = 0; i < trending.length; i++) {
//          console.log("--- "+trending[i].name);
//       }
//
//       var trendRandom = Math.floor(Math.random()*10);
//       tweetIt(text + " " + trending[trendRandom].name);
//    })
// }
//
// //
// // Function to generate random integer in between
// //
// function getRandomInt(min, max) {
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }

//  Setting up a user stream
var stream = T.stream('user')

// Anytime someone follows me
stream.on('follow', function (event) {
   var name = event.source.name;
   var screenName = event.source.screen_name;
   if (screenName!="kitten_harian") {
      tweetItWithImageFromUrl('https://lh6.ggpht.com/sw_iT7GZASdAYeiecsZEHJE-EgDhdK2rCWUzZOJS0OFiGpoi9qn8iMH2nuXHgWg2PA=h900', ".@"+screenName + " Hi, "+name+" Thx for following me.. "+ emoji.emojify(':heart: :heart:'));
   }
});


setInterval(function() {
   xmlToJson(urlXml, function(err, data) {
     if (err) {
       // Handle this however you like
       return console.err(err);
     }

     // Do whatever you want with the data here
     // Following just pretty-prints the object
     var dataConverted = JSON.stringify(data, null, 2);
     var JsonDataconverted = JSON.parse(dataConverted);
     var imageUrl = JsonDataconverted.response.data[0].images[0].image[0].url[0];
     var sourceUrl = JsonDataconverted.response.data[0].images[0].image[0].source_url[0];

     tweetItWithImageFromUrl(imageUrl, "Miaww Miaww..."+ emoji.emojify(':heart: :heart:')+"\n\n\n\n\nsource : "+imageUrl);
   });

}, 1000*60);
