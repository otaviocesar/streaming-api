'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

 const { default: axios } = require('axios');

 const instagramApi = axios.create({
   baseURL: 'https://graph.facebook.com/v10.0/17841449244928730/'
 });

 //var strApi = 'http://10.0.2.2:1337';

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
      //console.log(ctx.headers.access_token)
      const params = {
          access_token: ctx.headers.access_token,
          fields: "id,media_url,caption,timestamp,like_count,comments_count"
      };
        
      const responsePosts = await instagramApi.get("media", { params })

      if (responsePosts.data.data && responsePosts.data.data.length > 0) {
          for (let p = 0; p < responsePosts.data.data.length; p++) {
              let postsAll = responsePosts.data.data[p];
              
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
    console.log("create");
    console.log("url: " + ctx.request.body.imageUrl);
   const paramsMedia = {
      access_token: ctx.headers.access_token,
      image_url: ctx.request.body.imageUrl,
      caption: ctx.request.body.caption
    };

    console.log(paramsMedia);
    
    const responseMedia = await instagramApi.post("media", { paramsMedia })
    console.log(responseMedia.status)

    if (responseMedia.status == 200){
      const paramsPublish = {
        access_token: ctx.headers.access_token,
        creation_id: responseMedia.data.id
      };

      const responsePublish = await instagramApi.post("media_publish", { paramsMedia })

      console.log("saveInstagramPosts");

      let entity;
      entity = await strapi.services.post.create(ctx.request.body);
      return sanitizeEntity(entity, { model: strapi.models.post });

    } else {
      console.log("Erro");
      return "";
    }
  },


 };