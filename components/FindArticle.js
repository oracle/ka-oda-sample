/*
** Knowledge Advanced/Oracle Digital Assistant Integration Sample Code
**
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at
** https://oss.oracle.com/licenses/upl.
*/

'use strict'

const KnowledgeRestManager = require('../lib/KnowledgeRestManager'),
      { Article, incrementSearchNumber } = require('../lib/utils')

module.exports = {
  metadata: () => ({
    name: 'oracle.apps.crm.knowledge.oda.accelerator.FindArticle',
    properties: {
      titleQuery: { required: true, type: 'string' },
      docIdQuery: { required: true, type: 'string' },
      findResultsVar: { required: true, type: 'string' },
      hasResultsVar: { requred: true, type: 'boolean' },
      answerIdVar: { required: true, type: 'string' },
      /*Environment properties*/
      contentApi: { required: true, type: 'string' },
      customerPortal: { required: true, type: 'string' },
      siteName: { required: true, type: 'string' },
      integrationUserName: { required: true, type: 'string' },
      integrationUserPassword: { required: true, type: 'string' },
      interfaceId: { required: true, type: 'integer' }
    },
    supportedActions: ['viewResults', 'viewArticle', 'noResults', 'restError']
  }),
  invoke: async (conversation, done) => {

    const { titleQuery,
            docIdQuery,
            findResultsVar,
            hasResultsVar,
            answerIdVar,
            customerPortal
          } = conversation.properties()

    const knowledgeRestManager = KnowledgeRestManager.getManager(conversation)

    /*Update current session number*/
    incrementSearchNumber(conversation)

    let contentURL = `content`
    if (docIdQuery) {
      contentURL += `?q=documentId+eq+'${encodeURIComponent(docIdQuery)}'`
    } else if (titleQuery) {
      contentURL += `?q=title+likeAny+('*${encodeURIComponent(titleQuery)}*')`
    } else {
      conversation.transition('noResults').keepTurn(true)
      done()
    }

    let results = await callFind(contentURL)

    if (results.length == 0) {
      /*No Results*/
      if (titleQuery && docIdQuery) {
        results = await callFind(`content?q=documentId+eq+'${encodeURIComponent(titleQuery)}'`)
      }
      if (results.length == 0) {
        conversation.transition('noResults').keepTurn(true)
        done()
        return
      }
    }

    if (results.length == 1) {
      /*Single Result*/
      conversation.variable(hasResultsVar, false)
      conversation.variable(answerIdVar, `${results[0].answerId}`)
      conversation.reply(`I found article ${results[0].documentId}:`)
      conversation.transition('viewArticle').keepTurn(true)
    } else {
      /*Multiple Results*/
      conversation.variable(hasResultsVar, true)
      let findResults = results.map(resultItem => new Article(
        `${resultItem.documentId}: ${resultItem.title}`,
        `Last Published: ${resultItem.publishDate.split('T')[0]}`,
        `${customerPortal}/app/answers/answer_view/a_id/${encodeURIComponent(resultItem.answerId)}`,
        `${resultItem.answerId}`,
        resultItem.documentId.match(/[A-Z]+/i)[0].toLowerCase()))
      conversation.variable(findResultsVar, findResults)
      conversation.transition('viewResults').keepTurn(true)
    }
    done()

    /*API call*/
    async function callFind(queryUrl) {
      let queryResponseBody
      try {
        conversation.logger().info('query URL: ' + queryUrl)
        queryResponseBody = await knowledgeRestManager.contentRequest(queryUrl)
      } catch (e) {
        conversation.logger().error("Unexpected error. There may be issues with the network, or you may need to check your configuration.")
        conversation.logger().error(e)
        conversation.transition('restError')
        done()
        return
      }

      let returnedResults
      try {
        returnedResults = queryResponseBody.items
      } catch(e) {
        conversation.logger().error("Unexpected error. You may need to check your configuration or contact your help desk.")
        conversation.logger().error(e)
        done()
        return
      }
      return returnedResults
    }
  }
}