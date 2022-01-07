'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {

    async create(data, { files } = {}) {
        const validData = await strapi.entityValidator.validateEntityCreation(
          strapi.models.content,
          data,
          { isDraft: isDraft(data, strapi.models.content) }
        );
        console.log("Upload Content")
        const entry = await strapi.query('content').create(validData);
    
        if (files) {
          await strapi.entityService.uploadFiles(entry, files, {
            model: 'content',
          });
          return this.findOne({ id: entry.id });
        }
        return entry;
      },
};
