const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

 module.exports = {
    /**
     * Create a record.
     *
     * @return {Object}
     */
  
    async create(ctx) {
      let entity;

      var videoFileSize = "0";
      if (ctx.is('multipart')) {
        console.log("Upload Content")
        const { data, files } = parseMultipartData(ctx);
        var video = files.post;
        videoFileSize = video.size
        entity = await strapi.services.content.create(data, { files });
      } else {
        entity = await strapi.services.content.create(ctx.request.body);
      }
      console.log(entity.post.url);

      var responseBody;
      if(ctx.headers.video == "true" || ctx.headers.video == true){
        responseBody = {
          "videoUrl": entity.post.url,
          "videoFileSize": videoFileSize
        };

      } else {
        responseBody = {
          "imageUrl": entity.post.url
        };
      }


      return sanitizeEntity(responseBody, { model: strapi.models.post });
    },
  };
