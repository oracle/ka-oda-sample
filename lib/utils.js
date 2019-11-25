/*
** Knowledge Advanced/Oracle Digital Assistant Integration Sample Code
**
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at
** https://oss.oracle.com/licenses/upl.
*/

'use strict'

module.exports = {
  /*Create & format object to pass into sections data*/
  Section: function (header, content, imageURL) {
    this.header = header;
    this.content = content;
    this.imageURL = imageURL;
  },

  /*Create & format object to pass into article list*/
  Article: function(title, excerpt, link, answerId, contentType) {
    this.title = title;
    this.excerpt = excerpt;
    this.link = link;
    this.answerId = answerId;
    this.contentType = contentType;
  },

  /*Increment ID number of current search session*/
  incrementSearchNumber: function(conversation) {
    let knowledgeSearchNumber = conversation.variable('user.knowledgeSearchNumber')
    if (! knowledgeSearchNumber) {
      conversation.variable('user.knowledgeSearchNumber', 1)
    } else {
      if (knowledgeSearchNumber >= Number.MAX_SAFE_INTEGER) {
        knowledgeSearchNumber = 0
      }
      conversation.variable('user.knowledgeSearchNumber', knowledgeSearchNumber + 1)
    }
  }
}
