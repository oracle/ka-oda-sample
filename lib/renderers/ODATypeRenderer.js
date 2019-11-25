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
		let oda = content["$$"][0]
		let thumbnailURL = ''
		let thumbnailURLMaybe = oda["$$"].find(elem => elem["#name"] == "THUMBNAIL_URL")
		if (conversation.channelType() != "twilio" && thumbnailURLMaybe && thumbnailURLMaybe["$$"][0]["_"].length) {
			thumbnailURL = thumbnailURLMaybe["$$"][0]["_"]
		}

		let articleURL = `${customerPortal}/app/answers/answer_view/a_id/${encodeURIComponent(metadata.answerId)}`
		let articleURLMaybe = oda["$$"].find(elem => elem["#name"] == "ARTICLE_URL")
		if (articleURLMaybe && articleURLMaybe["$$"][0]["_"].length) {
			articleURL = articleURLMaybe["$$"][0]["_"]
		}

		let sections = []
		let summary = oda["$$"].find(elem => elem["#name"] == "SUMMARY")["$$"][0]["_"]
		if (conversation.channelType() == 'twilio') {
			summary += '\n'
		}

		sections.push(new Section(metadata.title, summary, thumbnailURL));
		oda["$$"].filter(elem => elem["#name"] == "SECTION").forEach(section => {
			let header = section["$$"].find(elem => elem["#name"] == "HEADER")["$$"][0]["_"]
			let body = section["$$"].find(elem => elem["#name"] == "BODY")["$$"][0]["_"]
			sections.push(new Section(header, body, ''))
		})

		return ConversationOutputManager.sectionedArticleDetailToCardMessage(conversation, sections, articleURL)
	}

}
