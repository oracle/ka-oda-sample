/*
** Knowledge Advanced/Oracle Digital Assistant Integration Sample Code
**
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at
** https://oss.oracle.com/licenses/upl.
*/

'use strict'

const parser = require('xml-js'),
      parserOptions = {
        cdataKey: "_",
        elementsKey: "$$",
        nameKey: "#name"
      },
      { Section } = require('../lib/utils'),
      KnowledgeRestManager = require('../lib/KnowledgeRestManager'),
      ConversationOutputManager = require('../lib/ConversationOutputManager')

module.exports = {
  metadata: () => ({
    name: 'oracle.apps.crm.knowledge.oda.accelerator.ViewArticle',
    properties: {
      answerID: { required: true, type: 'string' },
      hasResultsVar: { required: true, type: 'boolean' },
      /*Environment properties*/
      contentApi: { required: true, type: 'string' },
      customerPortal: { required: true, type: 'string' },
      siteName: { required: true, type: 'string' },
      integrationUserName: { required: true, type: 'string' },
      integrationUserPassword: { required: true, type: 'string' },
      interfaceId: { required: true, type: 'integer' }
    },
    supportedActions: ['viewResults', 'intent', 'done', 'restError']
  }),
  invoke: async (conversation, done) => {
    const {
      answerID,
      hasResultsVar,
      customerPortal
    } = conversation.properties()

    const viewArticleHasBeenDisplayed = conversation.variable('viewArticleHasBeenDisplayed')

    if (viewArticleHasBeenDisplayed) {
      let input = conversation.text()
      if (input) {
        if (/yes|yeah|sure|alright|okay|back/.test(input.toLowerCase())) {
          conversation.transition('viewResults').keepTurn(true)
        } else if (/no/.test(input.toLowerCase())) {
          conversation.transition('done').keepTurn(true)
        } else {
          conversation.transition('intent').keepTurn(true)
        }
      }
      done()

    } else {

      let postback = conversation.postback()
      if (postback && postback.nextAction == 'goToLink') {
        /* Displaying External Link/Unsupported Article Type from SMS Search Results*/
        conversation.reply(ConversationOutputManager.linkToTextMessage(postback.articleTitle, postback.articleIdOrLink))
      } else {
        const knowledgeRestManager = KnowledgeRestManager.getManager(conversation)
        const contentUrl = `content/answers/${encodeURIComponent(answerID)}?mode=EXTENDED`

        let responseBody
        try {
          responseBody = await knowledgeRestManager.contentRequest(contentUrl)
          conversation.logger().info(JSON.stringify(responseBody, null, 4))
        } catch (e) {
          conversation.logger().warn(JSON.stringify(e, null, 4))
          if (e.error && e.error.error && e.error.error.errorCode === "OKDOM-GEN0002") {
            conversation.reply("I couldn't find that article. What else can I help you with?")
            conversation.transition('done')
          } else {
            conversation.logger().error("Unexpected error. There may be issues with the network, or you may need to check your configuration.")
            conversation.logger().error(e)
            conversation.transition('restError').keepTurn(true)
          }
          done()
          return
        }

        let contentObject
        try {
          contentObject = parser.xml2js(responseBody.xml, parserOptions)
          conversation.logger().info("ViewArticle.js, contentObject: " + JSON.stringify(contentObject, null, 4))
        } catch (e) {
          conversation.logger().error("There is no XML in the article. Check the Authoring configuration.")
          conversation.error(e)
          done()
          return
        }

        if (conversation.variable('searchReturnedIntentMatch')) {
          /*** KA Intent Match ***/
          conversation.reply('I found the following article related to your search:')
        }

        let contentType = responseBody.contentType.referenceKey.toLowerCase()
        conversation.reply(ConversationOutputManager.renderContent(conversation, contentType, responseBody, contentObject, customerPortal))
      }

      if (conversation.variable('searchReturnedIntentMatch') && conversation.variable(hasResultsVar)) {
        /*** If coming from KA Intent Match, and more results exist ***/
        conversation.variable('viewArticleHasBeenDisplayed', true)
        conversation.reply('Would you like to see more search results?')
      } else if (conversation.variable(hasResultsVar)) {
        /*** If regular Search/Find results exist ***/
        conversation.variable('viewArticleHasBeenDisplayed', true)
        conversation.reply('Would you like to go back to your search results?')
      } else {
        /*** End state immediately if no user response expected ***/
        conversation.transition('done').keepTurn(true)
      }
      done()
    }
  }
}
