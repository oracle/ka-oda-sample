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
    name: 'oracle.apps.crm.knowledge.oda.accelerator.KnowledgeSearch',
    properties: {
      queryString: { required: true, type: 'string' },
      searchResultsVar: { required: true, type: 'string' },
      answerIdVar: { required: true, type: 'string' },
      hasResultsVar: { required: true, type: 'string' },
      /*Environment properties*/
      contentApi: { required: true, type: 'string' },
      searchApi: { required: true, type: 'string' },
      customerPortal: { required: true, type: 'string' },
      siteName: { required: true, type: 'string' },
      integrationUserName: { required: true, type: 'string' },
      integrationUserPassword: { required: true, type: 'string' },
      interfaceId: { required: true, type: 'integer' }
    },
    supportedActions: ['viewResults', 'viewArticle', 'noResults', 'restError']
  }),
  invoke: async (conversation, done) => {

    const {
      queryString,
      searchResultsVar,
      answerIdVar,
      hasResultsVar,
      customerPortal
    } = conversation.properties()

    const knowledgeRestManager = KnowledgeRestManager.getManager(conversation)

    /*Update current session number*/
    incrementSearchNumber(conversation)

    const questionUrl = `search/question?question=${encodeURIComponent(queryString)}`
    const questionOptions = {
      body: {},
      method: 'POST'
    }

    let questionResponseBody
    try {
      questionResponseBody = await knowledgeRestManager.searchRequest(questionUrl, questionOptions)
    } catch (e) {
      conversation.logger().error("Unexpected error. There may be issues with the network, or you may need to check your configuration.")
      conversation.logger().error(e)
      conversation.transition('restError').keepTurn(true)
      done()
      return
    }

    let firstResultItem
    try {
      firstResultItem = questionResponseBody.results.results[0].resultItems[0]
    } catch (e) {
      conversation.logger().info(`No search results in ${JSON.stringify(questionResponseBody)}: ${e}`)
    }

    let searchResults
    let intentResponse = false
    if (!firstResultItem) {
      /*** No search results returned ***/
      conversation.transition('noResults').keepTurn(true)
      done()
      return
    } else {
      let resultItemsToDisplay = questionResponseBody.results.results[0].resultItems

      /*** Determine if KA intent match ***/
      if (firstResultItem.type == 'template') {
        intentResponse = true
        conversation.variable(answerIdVar, `${firstResultItem.globalAnswerId}`)
        conversation.variable('searchReturnedIntentMatch', true)
        resultItemsToDisplay = resultItemsToDisplay.filter(resultItem => resultItem.title.url)
      }

      /*** No valid search results ***/
      if (! resultItemsToDisplay.length) {
        conversation.transition('noResults').keepTurn(true)
        done()
        return
      }

      /*** Map search results to article list and set in ODA ***/
      searchResults = resultItemsToDisplay.map(resultItem => {
        let title = resultItem.title.snippets.map(snippet => snippet.text).join('')
        let excerpt = (resultItem.textElements || []).map(textElement => textElement.snippets.map(snippet => snippet.text).join('')).join('')
        let answerId, link, contentType
        if (resultItem.globalAnswerId) {
          contentType = resultItem.title.url.match(/IM:\w+:/i)[0].split(":")[1].toLowerCase()
          answerId = `${resultItem.globalAnswerId}`
          link = `${customerPortal}/app/answers/answer_view/a_id/${encodeURIComponent(resultItem.globalAnswerId)}`
        } else {
          /*External Link*/
          answerId = null
          contentType = 'ext_link'
          link = `${resultItem.link}`
        }
        return new Article(title, excerpt, link, answerId, contentType)
      })
      conversation.variable(hasResultsVar, resultItemsToDisplay.length > 1)
      conversation.variable(searchResultsVar, searchResults)
    }

    if (intentResponse) {
      /*** Transition to KA intent match case ***/
      conversation.transition('viewArticle').keepTurn(true)
    } else {
      /*** Transition to regular search case ***/
      conversation.transition('viewResults').keepTurn(true)
    }
    done()
  }
}
