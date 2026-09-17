# 第三方许可说明 / Third-party licenses

kunDraw 自身代码与仓库中使用的第三方依赖适用不同许可。**第三方依赖的许可不因本仓库公开而改变**，使用者需要自行遵守。

## 依赖许可一览

| 依赖 | 许可 |
| --- | --- |
| `tldraw`、`@tldraw/editor` | tldraw license（见下方原文，**默认仅允许开发环境使用**） |
| `@tldraw/tlschema`、`@tldraw/store`、`@tldraw/utils` | MIT |
| `react`、`react-dom` | MIT |
| `@base-ui/react` | MIT |
| `cmdk` | MIT |
| `cn` | MIT |
| `lucide-react` | ISC |
| `react-resizable-panels` | MIT |
| `shadcn` | MIT |
| `sonner` | MIT |
| `tailwindcss`、`@tailwindcss/vite` | MIT |
| `tw-animate-css` | MIT |
| `class-variance-authority` | Apache-2.0 |
| `@fontsource-variable/geist` | OFL-1.1 |
| `vite` | MIT |
| `eslint` | MIT |
| `typescript` | Apache-2.0 |

MIT / ISC / Apache-2.0 / OFL 等标准许可的完整文本随各自包提供（`node_modules/<包名>/LICENSE*`），此处不再转录。

## tldraw 的特别说明

- **默认许可只允许开发环境**：内部开发、测试、预发可以自由使用；"Production Environment"（跑在服务器 / 云平台 / Web 应用上，或向终端用户、客户、公众提供功能）需要额外的 License Key。
- 生产环境可选：100 天免费试用、免费 hobby license（画布保留 "made with tldraw" 水印）、付费商业许可。参见 https://tldraw.dev/pricing
- **不要移除版权与许可声明，也不要禁用、修改或干扰 License Key 校验和水印**。
- 不要把 tldraw 的代码放到比本许可更宽松的许可下（例如不能对整个仓库套 MIT 而忽略 tldraw 部分）。
- 分发时需要附带本许可的逐字副本，即以下全文。
- 商标使用遵循 tldraw 的商标政策：https://tldraw.dev/legal/trademark-guidelines

## tldraw license（逐字副本，来自 `tldraw` v5.4.2 / https://github.com/tldraw/tldraw/blob/main/LICENSE.md）

<!-- 以下内容为 tldraw license 原文，请勿修改 -->

# tldraw license

This License from tldraw, Inc. (“tldraw”) governs your use of the accompanying Software. By using the Software, you accept the terms of this License. The tldraw software is copyrighted by tldraw Inc.

Alternative licenses are available from tldraw for commercial and non-commercial use. To get an alternative license or to learn more, visit https://tldraw.dev or contact sales@tldraw.com.

## Definitions

"Production Environment" means any production deployment of the Software that operates on servers, cloud platforms, web applications, or where the software is used to provide functionality to end users, customers, or the public. Production Environment excludes internal development.

"Development Environment" means any internal hosting or deployment of the Software for development, testing, or staging purposes, operated by your organization and not accessible to end users, customers, or the public.

"License Key" means the programmatically generated key that controls Software functionality and usage restrictions.

## Permissions

Subject to the following conditions, you are permitted to:

- Use the Software in Development Environments.
- Modify the Software to suit your needs.
- Bundle the Software with your own projects.
- Submit modifications of the Software to tldraw.

## Conditions

In exchange for these permissions, you agree:

- Not to use the Software in Production Environments.
- Not to disable, change, or interfere with the Software's License Key enforcement.
- Not to remove any copyright or other notices from the Software.
- Not to make the Software available under a license that supersedes or negates the effect of this License.
- Not to distribute the Software or modifications of the Software as a standalone product, but only as part of another application.
- To include a verbatim copy of this License in any distribution of the Software.
- To comply with tldraw's trademark policy.

## Trial license

In the case that tldraw makes the Software available to you on a trial basis, you are permitted to use the Software in Production Environments for the specified period beginning from the date of the trial’s License Key issuance. Business units are limited to one trial period unless otherwise approved by tldraw in writing.

## Commercial license

In the case that tldraw makes the Software available to you under the terms of a separate commercial agreement, you are permitted to use the Software in Production Environments for the specified period beginning from the date of the agreement’s License Key issuance.

## Termination

Your license to use the Software will terminate automatically if you breach any terms of this License or initiate a copyright, trade secret, or patent claim against tldraw, any of its affiliates, or any user of the Software (including as modified by you).

## Technical enforcement

The Software includes technical measures to verify License Key validity, detect deployment environments, enforce usage restrictions based on license type, and ensure proper watermark display. The Software may collect and transmit usage data to tldraw for license compliance purposes.

## Ownership of intellectual property

tldraw retains all right, title, and interest in the Software, including all intellectual property rights therein. This Agreement grants you only the specific, limited rights expressly set forth herein, and tldraw reserves all rights not expressly granted.

## Disclaimer of warranties

The Software is provided "AS IS," without any warranties. This includes any implied warranties of merchantability, fitness for a particular purpose, or non-infringement. You must pass this disclaimer on whenever you distribute the Software or derivative works.

## Limitation of liability

tldraw is not liable for any damages related to the Software or this License, including direct, indirect, special, or incidental damages, to the fullest extent permitted by law. You must pass this limitation of liability on whenever you distribute the Software or derivative works.

## Governing law

This License is governed by the laws of Delaware, and the parties consent to exclusive jurisdiction in Delaware courts. The parties waive all defenses of lack of personal jurisdiction and forum non-conveniens.

## Entire agreement / assignment

This License is the entire agreement between the parties, and supersedes any and all prior agreements, understandings or communications, written or oral, between the parties relating to the subject matter hereof. This License may be assigned by tldraw without your prior consent.
