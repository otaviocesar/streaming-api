'use strict';
const google = require('googleapis').google
const youtube = google.youtube({ version: 'v3'})
const OAuth2 = google.auth.OAuth2
const got = require('got');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

 const { default: axios } = require('axios');

 const instagramApi = axios.create({
   baseURL: 'https://graph.facebook.com/v10.0/17841449244928730/'
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

    if(ctx.query.instagram == "true"){
      const params = {
          access_token: ctx.headers.access_token,
          fields: "id,media_url,caption,timestamp,like_count,comments_count"
      };
        
      const responsePosts = await instagramApi.get("media", { params })

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
                      'https://raw.githubusercontent.com/otaviocesar/streaming-app/main/lib/data/instagram-icon.png'
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
                  imageUrl: 'https://avatars.githubusercontent.com/u/38116117?v=4'
                }
              });
          }
      } else {
          console.log("Nenhum post encontrado no Instagram.")
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

    try {

      if(ctx.headers.instagram == "true" || ctx.headers.instagram == true){
        console.log("Upload On Instagram")
        if(ctx.headers.video == "true" || ctx.headers.video == true){

          const paramsMediaVideo = {
            media_type: "VIDEO",
            access_token: ctx.headers.access_token,
            video_url: ctx.request.body.imageUrl,
            caption: ctx.request.body.caption
          };

          var responseMediaVideo = await instagramApi.post("media", paramsMediaVideo)

        } else {

          const paramsMedia = {
            access_token: ctx.headers.access_token,
            image_url: ctx.request.body.imageUrl,
            caption: ctx.request.body.caption
          };

          const responseMedia = await instagramApi.post("media", paramsMedia)
    
          const paramsPublish = {
            access_token: ctx.headers.access_token,
            creation_id: responseMedia.data.id
          };
    
          const responsePublish = await instagramApi.post("media_publish", paramsPublish)
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
            var responsePublishVideo = await instagramApi.post("media_publish", paramsPublishVideo)

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
          console.log("Video Publicado com sucesso no Instagram!");
          ctx.request.body.idPost = responsePublishVideo.data.id;
          ctx.request.body.isOnInstagram = true;

        }
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
