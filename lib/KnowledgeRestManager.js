/*
** Knowledge Advanced/Oracle Digital Assistant Integration Sample Code
**
** Copyright (c) 2019 Oracle and/or its affiliates.  All rights reserved.
** Licensed under the Universal Permissive License v 1.0 as shown at
** https://oss.oracle.com/licenses/upl.
*/

'use strict'

const request = require('request-promise-native')
const integrationUserTokenCache = {}

module.exports = {
  getManager: conversation => {
    const {
      contentApi,
      searchApi,
      siteName,
      integrationUserName,
      integrationUserPassword,
      interfaceId
    } = conversation.properties()

    const versionedContentApi = `${contentApi}/latest`,
          versionedSearchApi = `${searchApi}/latest`,
          integrationUserTokenCacheKey = JSON.stringify({
            contentApi,
            siteName,
            integrationUserName
          })

    return {
      contentRequest: (relativeUrl, options) =>
        knowledgeRestRequest(`${versionedContentApi}/${relativeUrl}`, options),
      searchRequest: (relativeUrl, options) =>
        knowledgeRestRequest(`${versionedSearchApi}/${relativeUrl}`, options),
      getIntegrationUserToken: getIntegrationUserToken
    }

    async function knowledgeRestRequest(url, optionsArgument) {
      const defaultOptions = {
        json: true,
        rejectUnauthorized: false
      }

      const options = Object.assign(defaultOptions, optionsArgument)
      options.headers = Object.assign({
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }, options.headers)

      if (!options.headers.hasOwnProperty('kmauthtoken')) {
        const integrationUserToken = await getIntegrationUserToken()
        options.headers.kmauthtoken = JSON.stringify({
          siteName,
          interfaceId,
          integrationUserToken
        })
      }

      let body
      try {
        body = await request(url, options)
      } catch (err) {
        const isSessionTokenExpired = !!(err && err.response && err.response.body && err.response.body.error
          && err.response.body.error.errorCode == 'OK-SESSION0003')
        if (isSessionTokenExpired) {
          conversation.logger().info(`Integration user token expired for ${integrationUserTokenCacheKey}`)
          delete integrationUserTokenCache[integrationUserTokenCacheKey]
          if (optionsArgument.headers.kmauthtoken) {
            delete optionsArgument.headers.kmauthtoken
          }
          return await knowledgeRestRequest(url, optionsArgument)
        }
        // Don't log integrationUserPassword
        if (options.body) {
          delete options.body.password
        }
        conversation.logger().warn(JSON.stringify({ url, options, err }, null, 4))
        throw err
      }
      // Don't log integrationUserPassword
      if (options.body) {
        delete options.body.password
      }
      conversation.logger().info(JSON.stringify({ url, options, body }, null, 4))
      return body
    }

    async function getIntegrationUserToken(forceRegenerate) {
      if (!forceRegenerate && integrationUserTokenCache[integrationUserTokenCacheKey])
        return integrationUserTokenCache[integrationUserTokenCacheKey]

      conversation.logger().info(`Generating integration user token for ${integrationUserTokenCacheKey}`)

      const url = `${versionedContentApi}/auth/integration/authorize`
      const options = {
        body: {
          login: integrationUserName,
          password: integrationUserPassword,
          siteName: siteName
        },
        headers: {
          kmauthtoken: JSON.stringify({ siteName, localeId: "en_US" })
        },
        method: 'POST'
      }

      const body = await knowledgeRestRequest(url, options)

      const integrationUserToken = body.authenticationToken
      integrationUserTokenCache[integrationUserTokenCacheKey] = integrationUserToken

      const waitTimeInHours = 23
      setTimeout(function () {
        conversation.logger().info(`Regenerating integration user token for ${integrationUserTokenCacheKey} after waiting ${waitTimeInHours} hours`)
        getIntegrationUserToken(true)
      }, waitTimeInHours * 60 * 60 * 1000)

      return integrationUserToken
    }

  }
}
