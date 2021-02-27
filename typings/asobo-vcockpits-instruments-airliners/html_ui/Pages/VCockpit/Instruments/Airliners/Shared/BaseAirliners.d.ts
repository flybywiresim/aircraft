/// <reference path="../../../../../../../fs-base-ui/html_ui/JS/common.d.ts" />

declare global {
    namespace Airliners {
        class BaseEICAS {
        }

        class EICASTemplateElement extends TemplateElement {
            init(): void
            update(_deltaTime: number): void
        }
    }
}

export {};
