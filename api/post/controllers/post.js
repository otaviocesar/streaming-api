'use strict';
const google = require('googleapis').google
const youtube = google.youtube({ version: 'v3'})
const OAuth2 = google.auth.OAuth2
const got = require('got');
const OAuth = require('oauth-1.0a');
const crypto = require('crypto');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

 const { default: axios } = require('axios');

 const instagramApi = axios.create({
   baseURL: 'https://graph.facebook.com/v10.0/'
 });

/*  const strApi = axios.create({
  baseURL: env('STRAPI_URL', 'http://10.0.2.2:1337/')
}); */

const strApi = axios.create({
  baseURL: 'https://api-streaming-integration.herokuapp.com/'
});

 const { sanitizeEntity } = require('strapi-utils');

 module.exports = {
   /**
    * Retrieve records.
    *
    * @return {Array}
    */
 
   async find(ctx) {

     let entities;
     var posts = [];

    if(ctx.query.instagram == "true" || ctx.query.instagram == true){
      let accessToken = ctx.headers.access_token;
      let urlFacebookPage = "me/accounts?access_token=" + accessToken;
      let getFacebookPage = await instagramApi.get(urlFacebookPage)

      const facebookPage = getFacebookPage.data.data[0].id 
      console.log(facebookPage)

      let urlInstagramPage = String(facebookPage) + "?access_token=" + accessToken + "&fields=instagram_business_account";
      let getInstagramPage = await instagramApi.get(urlInstagramPage)
      let instagramPage = getInstagramPage.data.instagram_business_account.id 
      console.log(instagramPage)
    
      const params = {
        access_token: ctx.headers.access_token,
        fields: "id,media_url,caption,timestamp,like_count,comments_count"
      };

      let urlMedia = instagramPage + "/media";
        
      const responsePosts = await instagramApi.get(urlMedia , { params })

      if (responsePosts.data.data && responsePosts.data.data.length > 0) {
          for (let p = 0; p < responsePosts.data.data.length; p++) {
              let postsAll = responsePosts.data.data[p];
              let isVideo = false;

             let mediaUrl = postsAll.media_url;
             isVideo = mediaUrl.includes(".mp4");
              
              posts.push({
                platform: {
                  name: 'Instagram',
                  imageUrl:
                      'https://streaming-api-assets.s3.sa-east-1.amazonaws.com/instagram_icon_f5ad8ab0a2.png'
                },
                idPost: postsAll.id,
                caption: postsAll.caption,
                timeAgo: postsAll.timestamp,
                imageUrl: postsAll.media_url,
                likes: postsAll.like_count,
                comments: postsAll.comments_count,
                isVideo: isVideo,
                user: {
                  name: 'Streaming Api',
                  imageUrl: ''
                }
              });
          }
      } else {
          console.log("Nenhum post encontrado no Instagram.")
      }
    }

      if(ctx.query.twitter == "true" || ctx.query.twitter == true){
        console.log("Consulta no Twitter")
        let accessTokenTwitter = "Bearer " + ctx.headers.access_token_twitter;

        const twitterApiGET = axios.create({
          baseURL: 'https://api.twitter.com/2/',
          headers: {Authorization: accessTokenTwitter}
        });
    
        let paramsTwitter = "?expansions=in_reply_to_user_id%2Creferenced_tweets.id.author_id%2Centities.mentions.username%2Creferenced_tweets.id%2Cgeo.place_id%2Cattachments.media_keys&tweet.fields=public_metrics,created_at&media.fields=url%2Calt_text%2Cnon_public_metrics%2Corganic_metrics%2Cpromoted_metrics%2Cwidth%2Ctype%2Cmedia_key%2Cpreview_image_url%2Cheight%2Cduration_ms%2Cpublic_metrics";
    
        let urlMediaTwitter = "users/1484314058472173568/tweets" + paramsTwitter;
          
        const responsePostsTwitter = await twitterApiGET.get(urlMediaTwitter)

        if (responsePostsTwitter.data.data && responsePostsTwitter.data.data.length > 0) {
          for (let p = 0; p < responsePostsTwitter.data.data.length; p++) {
              let postsAll = responsePostsTwitter.data.data[p];
              let isVideo = false;
              
              posts.push({
                platform: {
                  name: 'Twitter',
                  imageUrl:
                      'https://streaming-api-assets.s3.sa-east-1.amazonaws.com/twitter_icon_edcfdc0f0a.png'
                },
                idPost: postsAll.id,
                caption: postsAll.text,
                timeAgo: postsAll.created_at,
                imageUrl: "",
                likes: postsAll.public_metrics.like_count,
                comments: postsAll.public_metrics.reply_count,
                isVideo: isVideo,
                user: {
                  name: 'Streaming Api',
                  imageUrl: ''
                }
              });
          }
      } else {
          console.log("Nenhum post encontrado no Twitter.")
      }

      }
/*      if (ctx.query._q) {
       entities = await strapi.services.post.search(ctx.query);
     } else {
       entities = await strapi.services.post.find(ctx.query);
     } */

     
     return posts.map(entity => sanitizeEntity(entity, { model: strapi.models.post }));
     //return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.post }));
   },


   async create(ctx) {

    ctx.request.body.isOnInstagram = false;
    ctx.request.body.isOnYoutube = false;
    ctx.request.body.isOnTwitter = false;

    try {

      if(ctx.headers.instagram == "true" || ctx.headers.instagram == true){
        console.log("Upload On Instagram")

        let accessToken = ctx.headers.access_token;
        let urlFacebookPage = "me/accounts?access_token=" + accessToken;
        let getFacebookPage = await instagramApi.get(urlFacebookPage)
  
        const facebookPage = getFacebookPage.data.data[0].id 
        console.log(facebookPage)
  
        let urlInstagramPage = String(facebookPage) + "?access_token=" + accessToken + "&fields=instagram_business_account";
        let getInstagramPage = await instagramApi.get(urlInstagramPage)
        let instagramPage = getInstagramPage.data.instagram_business_account.id 
        console.log(instagramPage)
  
        var urlMedia = instagramPage + "/media";
        var urlMediaPublish = instagramPage + "/media_publish";

        if(ctx.headers.video == "true" || ctx.headers.video == true){

          const paramsMediaVideo = {
            media_type: "VIDEO",
            access_token: ctx.headers.access_token,
            video_url: ctx.request.body.imageUrl,
            caption: ctx.request.body.caption
          };

          var responseMediaVideo = await instagramApi.post(urlMedia, paramsMediaVideo)

        } else {

          const paramsMedia = {
            access_token: ctx.headers.access_token,
            image_url: ctx.request.body.imageUrl,
            caption: ctx.request.body.caption
          };

          const responseMedia = await instagramApi.post(urlMedia, paramsMedia)
    
          const paramsPublish = {
            access_token: ctx.headers.access_token,
            creation_id: responseMedia.data.id
          };
    
          const responsePublish = await instagramApi.post(urlMediaPublish, paramsPublish)
          ctx.request.body.idPost = responsePublish.data.id;
          ctx.request.body.isOnInstagram = true;
          console.log("Imagem Publicada com sucesso no Instagram!");
        }
      }  

      if(ctx.headers.youtube == "true" || ctx.headers.youtube == true){

        console.log("Upload On Youtube")
        const videoFileSize = Number(ctx.request.body.videoFileSize)
        const videoUrl = ctx.request.body.imageUrl
        videoUpload(videoUrl, videoFileSize);

        ctx.request.body.isOnYoutube = true;
        async function videoUpload(videoUrl, videoFileSize) {
          try {
                
            const OAuthClient = await createOAuthClient()
      
            async function createOAuthClient() {
              const client_id_firebase = ctx.headers.client_id_firebase; 
              const client_secret_firebase = ctx.headers.client_secret_firebase;
          
              const OAuthClient = new OAuth2(
                client_id_firebase,
                client_secret_firebase
              )
          
              return OAuthClient
            }
        
            var tokens = { 
              access_token: ctx.headers.access_token_youtube,
              scope: "https://www.googleapis.com/auth/youtube",
              token_type:"Bearer"
            };
        
            OAuthClient.setCredentials(tokens);
        
            await setGlobalGoogleAuthentication(OAuthClient);
            
            function setGlobalGoogleAuthentication(OAuthClient) {
              google.options({
                auth: OAuthClient
              })
            }
    
            const content = {
              title: ctx.request.body.caption,
              sentences: [
                {
                    text: "Olá esse é um video de Teste usando a api do Youtube!", 
                    keywords: "api do yutube, upload de video",
                }
              ]
            }
 
            const videoTitle = `${content.title}`
            const videoTags = [content.sentences[0].keywords]
            const videoDescription = content.sentences.map((sentence) => {
              return sentence.text
            }).join('\n\n')
        
            const requestParameters = {
              part: 'snippet, status',
              requestBody: {
                snippet: {
                  title: videoTitle,
                  description: videoDescription,
                  tags: videoTags
                },
                status: {
                  privacyStatus: 'public'
                }
              },
              media: { 
                body: got.stream(videoUrl) 
              }
            }
        
            console.log('> [youtube-api] Starting to upload the video to YouTube')
            const youtubeResponse = await youtube.videos.insert(requestParameters, {
              onUploadProgress: onUploadProgress
            })
    
            console.log(`> [youtube-api] Video available at: https://youtu.be/${youtubeResponse.data.id}`)
            return youtubeResponse.data
            
            function onUploadProgress(event) {
              const progress = Math.round( (event.bytesRead / videoFileSize) * 100 )
              console.log(`> [youtube-api] ${progress}% completed`)
            }
    
          } catch (error) {
            console.log(error);
            console.log("Erro ao publicar!");
          }
        }

        console.log("Publicado com sucesso no Youtube!");
      } 

      if(ctx.headers.instagram == "true" || ctx.headers.instagram == true){
        console.log("media_publish On Instagram")
        if(ctx.headers.video == "true" || ctx.headers.video == true){
    
          var paramsPublishVideo = {
            access_token: ctx.headers.access_token,
            creation_id: responseMediaVideo.data.id
          };
          
          var contador = 0;  
          tryUploadVideo(paramsPublishVideo);
          async function tryUploadVideo(paramsPublishVideo) {
            console.log("Esperando video subir....")
            let time = await resolveAfter5Seconds(30000);
            var responsePublishVideo = await instagramApi.post(urlMediaPublish, paramsPublishVideo)
            console.log("Video Publicado com sucesso no Instagram!");
            ctx.request.body.isOnInstagram = true;

            if (responsePublishVideo.status == 200) {
              console.log("Sucesso!....")
            } else {
              if(contador <25){
                tryUploadVideo(paramsPublishVideo);
                contador = contador + 5;
                console.log("Aguardando mais um pouco....")
              } else {
                console.log("Video demorou demais para subir....")
              }
            }
          }

          function resolveAfter5Seconds(x) {
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(x);
              }, 30000);
            });
          }
        }
      }  

      if(ctx.headers.twitter == "true" || ctx.headers.twitter == true){
        console.log("Upload On Twitter")

        const oauth = OAuth({
          consumer: {
            key: ctx.headers.twitter_consumer_key, 
            secret: ctx.headers.twitter_consumer_secret, 
          },
          signature_method: 'HMAC-SHA1',
          hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
        });
  
        const endpointURL = `https://api.twitter.com/2/tweets`;
  
        const token = {
          key: ctx.headers.twitter_token_key,
          secret: ctx.headers.twitter_token_secret
        };
      
        const authHeader = oauth.toHeader(oauth.authorize({
          url: endpointURL,
          method: 'POST'
        }, token));
  
        console.log(authHeader);
  
        const twitterApi = axios.create({
          baseURL: 'https://api.twitter.com/2/',
          headers: authHeader
        });
  
        let text = ctx.request.body.caption + " " + ctx.request.body.imageUrl;

        const tweet = {
          "text":text
        };
  
        var responsePublishTweet = await twitterApi.post("tweets", tweet)
        console.log(responsePublishTweet);  
        ctx.request.body.isOnTwitter = true;

      }

    } catch (error) {
      console.log(error);
      console.log("Erro ao publicar!");
    }

    let entity;
    entity = await strapi.services.post.create(ctx.request.body);
    return sanitizeEntity(entity, { model: strapi.models.post });

  },
 };
