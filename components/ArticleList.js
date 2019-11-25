/*
** Knowledge Advanced/Oracle Digital Assistant Integration Sample Code
**
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at
** https://oss.oracle.com/licenses/upl.
*/

'use strict'


const ConversationOutputManager = require('../lib/ConversationOutputManager'),
      perPage = 4

module.exports = {
  metadata: () => ({
    name: 'oracle.apps.crm.knowledge.oda.accelerator.ArticleList',
    properties: {
      articleList: { required: true, type: 'array' },
      answerIdVar: { required: true, type: 'string' },
      hasResultsVar: { required: true, type: 'string' },
      customerPortal: { required: true, type: 'string' }
    },
    supportedActions: ['viewArticle', 'intent']
  }),
  invoke: (conversation, done) => {

    const { articleList,
            answerIdVar,
            hasResultsVar,
            customerPortal } = conversation.properties()

    const articleListHasBeenDisplayed = conversation.variable('articleListHasBeenDisplayed')
    const knowledgeSearchNumber = conversation.variable('user.knowledgeSearchNumber')
    let articleListStartIndex = conversation.variable('articleListStartIndex')

    let postback = conversation.postback()

    /*If user clicked on article detail button */
    if (postback && (postback.nextAction == 'goToArticle' || postback.nextAction == 'goToLink')) {

      if (postback.knowledgeSessionNumber != knowledgeSearchNumber) {
        conversation.variable(hasResultsVar, false)
      }
      conversation.variable(answerIdVar, postback.articleIdOrLink)
      conversation.transition('viewArticle').keepTurn(true)
      done()

    } else {

      if (articleListHasBeenDisplayed) {
        /*** Processing user response ***/
        let input = conversation.text()
        if (input) {
          if (/more|next/.test(input.toLowerCase())) {
            /*Go to next page of results*/
            if (articleListStartIndex + perPage < articleList.length) {
              articleListStartIndex += perPage
              conversation.variable('articleListStartIndex', articleListStartIndex)
              conversation.reply(ConversationOutputManager.articleListToCardMessage(conversation, articleList, knowledgeSearchNumber, articleListStartIndex, perPage))
              if (articleListStartIndex + perPage >= articleList.length) {
                conversation.reply(`You are at the end of your search results. You can do a more detailed search at ${customerPortal}, or type *find* or *search* to look for another article.`)
              } else {
                conversation.reply('You can type *see more* to see more results. Type *help* for other options.')
              }
            } else {
              conversation.transition('intent').keepTurn(true)
            }
            done()
          } else {
            /*Irrelevant user input case*/
            conversation.transition('intent').keepTurn(true)
            done()
          }
        }
      } else {
        /*** Showing results for first time ***/
        if (!articleListStartIndex) {
          articleListStartIndex = 0
          conversation.variable('articleListStartIndex', articleListStartIndex)
        }
        conversation.reply(ConversationOutputManager.articleListToCardMessage(conversation, articleList, knowledgeSearchNumber, articleListStartIndex, perPage))
        if (articleListStartIndex + perPage >= articleList.length) {
          conversation.reply(`You are at the end of your search results. You can do a more detailed search at ${customerPortal}, or type *find* or *search* to look for another article.`)
        } else {
          conversation.reply('You can type *see more* to see more results. Type *help* for other options.')
        }
        conversation.variable('articleListHasBeenDisplayed', true)
        done()
      }
    }
  }
}