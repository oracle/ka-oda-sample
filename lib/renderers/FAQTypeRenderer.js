/*
** Knowledge Advanced/Oracle Digital Assistant Integration Sample Code
**
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at
** https://oss.oracle.com/licenses/upl.
*/

'use strict'

const ConversationOutputManager = require('../ConversationOutputManager'),
	  { Section } = require('../../lib/utils')

module.exports = {

	formatOutput: function(conversation, metadata, content, customerPortal) {
		let articleURL = `${customerPortal}/app/answers/answer_view/a_id/${encodeURIComponent(metadata.answerId)}`
	    let sections = [];
	    if (conversation.channelType() == "twilio") {
	    	sections.push(new Section(`${metadata.documentId}: ${metadata.title.trim()}`, `Last Published: ${metadata.publishDate.split('T')[0]}\n`, ''))
	    } else {
	    	sections.push(new Section(`${metadata.documentId}: ${metadata.title.trim()}`, `Last Published: ${metadata.publishDate.split('T')[0]}`, ''))
	    }

		let question = ' ', answer = ' ', faq = content["$$"][0]
		let questionMaybe = faq["$$"].find(elem => elem["#name"] == "QUESTION")
		if (questionMaybe) {
			question = questionMaybe["$$"][0]["_"]
		}
		let answerMaybe = faq["$$"].find(elem => elem["#name"] == "ANSWER")
		if (answerMaybe) {
			answer = answerMaybe["$$"][0]["_"].replace(/<[\s\S]+?>/g, '').replace(/&quot;/g, '\"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&apos;/g, "\'").replace(/&amp;/g, '&')
		}
		sections.push(new Section(question, answer, ''));

		return ConversationOutputManager.sectionedArticleDetailToCardMessage(conversation, sections, articleURL);
	}

}
