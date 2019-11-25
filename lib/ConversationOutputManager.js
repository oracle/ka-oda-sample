/*
** Knowledge Advanced/Oracle Digital Assistant Integration Sample Code
**
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at
** https://oss.oracle.com/licenses/upl.
*/

/**
 * Helper class for converting data to messages to be displayed in the chat, and for multi-channel handling of message output
 */

'use strict'

const MessageModel = require('@oracle/bots-node-sdk/lib/message/messageModel').MessageModel,
      { Section } = require('../lib/utils')

const ConversationOutputManager = {

	supportedTypes: {
		'oda': 'ODATypeRenderer',
		'faq': 'FAQTypeRenderer'
	},

	renderContent: function(conversation, contentType, metadata, content, customerPortal) {
		if (ConversationOutputManager.supportedTypes[contentType]) {
			const { formatOutput } = require('./renderers/' + ConversationOutputManager.supportedTypes[contentType])
			return formatOutput(conversation, metadata, content, customerPortal)
		} else {
			return ConversationOutputManager.DefaultTypeRenderer(conversation, metadata, content, customerPortal)
		}
	},

	DefaultTypeRenderer: function(conversation, metadata, content, customerPortal) {
		let articleURL = `${customerPortal}/app/answers/answer_view/a_id/${encodeURIComponent(metadata.answerId)}`
		let contentType = metadata.contentType.referenceKey;
		let body = content["$$"][0]["$$"][0]["$$"][0]["_"]
		let section = new Section(metadata.title.trim(), body, '');
		return ConversationOutputManager.unsectionedArticleDetailToCardMessage(conversation, section, articleURL);
 	},

	articleListToCardMessage: function(conversation, articleList, searchNumber, startIndex, resultsPerPage) {
		let cardList = []
		let actionList = []
		let end = Math.min(startIndex + resultsPerPage, articleList.length)
		for (let i = startIndex; i < end; i++) {
			let article = articleList[i]
			let action
			/*Format Action*/
			if (ConversationOutputManager.supportedTypes[article.contentType]) {
				/*Supported Article Types*/
				let postbackMessage = {'nextAction': 'goToArticle', 'articleIndexInList': i, 'articleIdOrLink': article.answerId, 'knowledgeSessionNumber': searchNumber}
				if (conversation.channelType() == "twilio") {
					action = MessageModel.postbackActionObject(`${article.title.trim()}\n`, undefined, postbackMessage)
				} else {
					action = MessageModel.postbackActionObject('See Summary', undefined, postbackMessage, undefined, true)
				}
			} else {
				/*Unsupported Article Types & External Links*/
				if (conversation.channelType() == "twilio") {
					let postbackMessage = {'nextAction': 'goToLink', 'articleIndexInList': i, 'articleLink': article.link, 'articleTitle': article.title.trim(), 'knowledgeSessionNumber': searchNumber}
					action = MessageModel.postbackActionObject(`(Link) ${article.title.trim()}\n`, undefined, postbackMessage)
				} else {
					action = MessageModel.urlActionObject('Open Link', undefined, article.link)
				}
			}

			/*Add Card or Action to List*/
			actionList.push(action)
			cardList.push(MessageModel.cardObject(article.title, article.excerpt, undefined, undefined, [action]))
		}

		conversation.reply(`Displaying the top *${articleList.length}* results. Here are results *${startIndex + 1}-${end}*.`)
		if (conversation.channelType() == "twilio") {
			return MessageModel.textConversationMessage('You can type the number of an article to see more details.\n', actionList)
		} else {
			return MessageModel.cardConversationMessage('vertical', cardList)
		}
	},

	linkToTextMessage: function(title, link) {
		return MessageModel.textConversationMessage(`${title}\n${link}`)
	},

	sectionedArticleDetailToCardMessage: function(conversation, sectionList, articleURL) {
		let cardList = [];
		sectionList.forEach(section => {
			if (conversation.channelType() == "twilio" && section.content.length > 500) {
				section.content = section.content.slice(0, 497) + "..."
			} else if (conversation.channelType() == "slack" && section.content.length > 2000) {
				section.content = section.content.slice(0, 1997) + "..."
			}
			cardList.push(MessageModel.cardObject(section.header, section.content, section.imageURL))
		})
		return MessageModel.cardConversationMessage('vertical', cardList, [MessageModel.urlActionObject('View Full Article', undefined, articleURL)])
	},

	unsectionedArticleDetailToCardMessage: function(conversation, section, articleURL) {
		let actions = [MessageModel.urlActionObject('View Full Article', undefined, articleURL)];
		if (conversation.channelType() == "twilio" && section.content.length > 500) {
			section.content = section.content.slice(0, 497) + "..."
		} else if (conversation.channelType() == "slack" && section.content.length > 2000) {
			section.content = section.content.slice(0, 1997) + "..."
		}
		let card = MessageModel.cardObject(section.header, section.content.substring(0, 200), undefined, undefined, actions);
		return MessageModel.cardConversationMessage('vertical', Array.of(card));
	}

}

module.exports = ConversationOutputManager
