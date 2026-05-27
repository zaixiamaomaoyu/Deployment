import axios from 'axios';
import { logger } from '../utils/logger';

const WECHAT_API_BASE = 'https://api.weixin.qq.com';

export interface WechatAccessToken {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

export interface WechatUserInfo {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

export class WechatService {
  private appId: string;
  private appSecret: string;

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  /**
   * 用 code 换取 access_token 和 openid
   */
  async getAccessToken(code: string): Promise<WechatAccessToken> {
    const url = `${WECHAT_API_BASE}/sns/oauth2/access_token`;
    const { data } = await axios.get(url, {
      params: {
        appid: this.appId,
        secret: this.appSecret,
        code,
        grant_type: 'authorization_code',
      },
      timeout: 10000,
    });

    if (data.errcode) {
      logger.error('微信换取 access_token 失败:', data);
      throw new Error(`微信授权失败: ${data.errmsg} (${data.errcode})`);
    }

    return data as WechatAccessToken;
  }

  /**
   * 获取微信用户信息
   */
  async getUserInfo(accessToken: string, openid: string): Promise<WechatUserInfo> {
    const url = `${WECHAT_API_BASE}/sns/userinfo`;
    const { data } = await axios.get(url, {
      params: {
        access_token: accessToken,
        openid,
        lang: 'zh_CN',
      },
      timeout: 10000,
    });

    if (data.errcode) {
      logger.error('获取微信用户信息失败:', data);
      throw new Error(`获取用户信息失败: ${data.errmsg} (${data.errcode})`);
    }

    return data as WechatUserInfo;
  }
}
