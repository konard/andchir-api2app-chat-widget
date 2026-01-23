/**
 * Api2AppChatWidget
 * https://api2app.org
 */
class Api2AppChatWidget {
    constructor(iframeSrc, options = {}) {
        this.iframeSrc = iframeSrc;
        this.options = {
            position: 'bottom-right', // bottom-right, bottom-left, top-right, top-left
            buttonColor: '#007bff',
            hoverColor: '#0056b3',
            width: 350,
            height: 400,
            useBackdrop: true,
            tooltipText: '', // Optional tooltip text, e.g., 'Открыть чат'
            hoverButtons: [], // Array of hover buttons: [{buttonColor, hoverColor, tooltipText, href, icon}]
            ...options
        };

        this.isOpen = false;
        this.hoverButtonsVisible = false;
        this.hoverTimeout = null;
        this.mediaQuery = window.matchMedia('(max-width: 768px)');
        this.mediaQueryHandler = (e) => this.handleMediaChange(e); // Сохраняем ссылку на обработчик

        this.init();
    }

    init() {
        this.createContainer();

        if (['top-right', 'top-left'].includes(this.options.position)) {
            this.createButton();
            this.createIframeBox();
        } else {
            this.createIframeBox();
            this.createButton();
        }
        this.setupEventListeners();
        this.handleMediaChange(this.mediaQuery);

        document.body.appendChild(this.container);
    }

    createContainer() {
        this.backdrop = document.createElement('div');
        this.backdrop.style.position = 'fixed';
        this.backdrop.style.zIndex = '9000';
        this.backdrop.style.left = '0';
        this.backdrop.style.top = '0';
        this.backdrop.style.width = '100%';
        this.backdrop.style.height = '100%';
        this.backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
        this.backdrop.style.pointerEvents = 'none'; // Allows clicks to pass through
        this.backdrop.style.display = 'none'; // Initially hidden
        document.body.appendChild(this.backdrop);

        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.zIndex = '10000';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';

        this.container.style.height = 'auto';
        this.container.style.minHeight = '0';
        this.container.style.width = 'auto';
        this.container.style.maxHeight = 'calc(100% - 30px)';
        this.container.style.maxWidth = '100%';

        this.updateContainerPosition();
    }

    updateContainerPosition(fullScreen) {
        fullScreen = fullScreen || false;
        const positions = {
            'bottom-right': {top: 'auto', bottom: '20px', left: 'auto', right: '20px', alignItems: 'flex-end'},
            'bottom-left': {top: 'auto', bottom: '20px', left: '20px', right: 'auto', alignItems: 'flex-start'},
            'top-right': {top: '20px', bottom: 'auto', right: '20px', alignItems: 'flex-end'},
            'top-left': {top: '20px', bottom: 'auto', left: '20px', alignItems: 'flex-start'}
        };
        const pos = positions[this.options.position] || positions['bottom-right'];
        if (fullScreen) {
            if (pos.top !== 'auto') {
                pos.top = 0;
            }
            if (pos.bottom !== 'auto') {
                pos.bottom = 0;
            }
            if (pos.left !== 'auto') {
                pos.left = 0;
            }
            if (pos.right !== 'auto') {
                pos.right = 0;
            }
        }
        Object.assign(this.container.style, pos);
    }

    createIframeBox() {
        this.iframeBox = document.createElement('div');
        this.iframeBox.style.display = 'none';
        this.iframeBox.style.flexGrow = '1';
        this.iframeBox.style.width = '100%';
        this.iframeBox.style.height = '100%';
        this.iframeBox.style.marginTop = ['top-right', 'top-left'].includes(this.options.position) ? '10px' : '0';
        this.iframeBox.style.marginBottom = ['top-right', 'top-left'].includes(this.options.position) ? '0' : '10px';
        this.iframeBox.style.borderRadius = '10px';
        this.iframeBox.style.overflow = 'hidden';
        this.iframeBox.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        this.iframeBox.style.border = '1px solid rgba(0,0,0,0.15)';
        this.iframeBox.style.backgroundColor = '#fff';

        // Animation properties
        this.iframeBox.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        this.iframeBox.style.opacity = '0';
        this.iframeBox.style.transform = 'translateY(20px)';

        this.iframe = document.createElement('iframe');
        this.iframe.style.width = '100%';
        this.iframe.style.height = '100%';
        this.iframe.style.border = 'none';

        this.iframeBox.appendChild(this.iframe);
        this.container.appendChild(this.iframeBox);
    }

    createButton() {
        // Create button wrapper to hold both button and tooltip
        this.buttonWrapper = document.createElement('div');
        this.buttonWrapper.style.position = 'relative';
        this.buttonWrapper.style.display = 'flex';
        this.buttonWrapper.style.alignItems = 'center';
        this.buttonWrapper.style.flexShrink = '0';

        // Create hover buttons container first (so it's behind the main button)
        if (this.options.hoverButtons && this.options.hoverButtons.length > 0) {
            this.createHoverButtons();
        }

        this.button = document.createElement('button');
        this.button.style.width = '60px';
        this.button.style.height = '60px';
        this.button.style.borderRadius = '50%';
        this.button.style.backgroundColor = this.options.buttonColor;
        this.button.style.border = 'none';
        this.button.style.cursor = 'pointer';
        this.button.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        this.button.style.display = 'flex';
        this.button.style.alignItems = 'center';
        this.button.style.justifyContent = 'center';
        this.button.style.transition = 'background-color 0.3s, transform 0.1s ease-in-out';
        this.button.style.flexShrink = '0';
        this.button.style.transform = 'scale(1)';
        this.button.style.transformOrigin = 'center center';
        this.button.style.position = 'relative';
        this.button.style.zIndex = '2';

        this.button.innerHTML = this.getChatIcon();
        this.buttonWrapper.appendChild(this.button);

        // Create tooltip if tooltipText is provided
        if (this.options.tooltipText) {
            this.createTooltip();
        }

        this.container.appendChild(this.buttonWrapper);
    }

    createHoverButtons() {
        this.hoverButtonsContainer = document.createElement('div');
        this.hoverButtonsContainer.style.position = 'absolute';
        this.hoverButtonsContainer.style.display = 'flex';
        this.hoverButtonsContainer.style.flexDirection = 'column';
        this.hoverButtonsContainer.style.gap = '10px';
        this.hoverButtonsContainer.style.zIndex = '1';
        this.hoverButtonsContainer.style.pointerEvents = 'none';

        // Position based on widget position (top or bottom)
        const isTopPosition = this.options.position.includes('top');
        if (isTopPosition) {
            this.hoverButtonsContainer.style.top = '0';
        } else {
            this.hoverButtonsContainer.style.bottom = '0';
        }

        this.hoverButtonsContainer.style.left = '0';

        this.hoverButtonElements = [];

        this.options.hoverButtons.forEach((hoverBtn, index) => {
            const btnWrapper = document.createElement('div');
            btnWrapper.style.position = 'relative';
            btnWrapper.style.display = 'flex';
            btnWrapper.style.alignItems = 'center';
            btnWrapper.style.opacity = '0';
            btnWrapper.style.transform = 'translateY(0)';
            btnWrapper.style.transition = `opacity 0.3s ease-in-out, transform 0.3s ease-in-out ${index * 0.05}s`;
            btnWrapper.style.pointerEvents = 'auto';

            const link = document.createElement('a');
            link.href = hoverBtn.href || '#';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.style.textDecoration = 'none';
            link.style.display = 'block';

            const btn = document.createElement('button');
            btn.style.width = '60px';
            btn.style.height = '60px';
            btn.style.borderRadius = '50%';
            btn.style.backgroundColor = hoverBtn.buttonColor || this.options.buttonColor;
            btn.style.border = 'none';
            btn.style.cursor = 'pointer';
            btn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            btn.style.display = 'flex';
            btn.style.alignItems = 'center';
            btn.style.justifyContent = 'center';
            btn.style.transition = 'background-color 0.3s, transform 0.1s ease-in-out';
            btn.style.transform = 'scale(1)';
            btn.style.transformOrigin = 'center center';

            if (hoverBtn.icon) {
                btn.innerHTML = hoverBtn.icon;
            }

            const originalColor = hoverBtn.buttonColor || this.options.buttonColor;
            const hoverColor = hoverBtn.hoverColor || this.options.hoverColor;

            btn.onmouseover = () => {
                btn.style.backgroundColor = hoverColor;
                if (hoverBtn.tooltipText) {
                    this.showHoverButtonTooltip(btnWrapper);
                }
            };
            btn.onmouseout = () => {
                btn.style.backgroundColor = originalColor;
                if (hoverBtn.tooltipText) {
                    this.hideHoverButtonTooltip(btnWrapper);
                }
            };
            btn.onmousedown = () => {
                btn.style.transform = 'scale(0.9)';
            };
            btn.onmouseup = () => {
                btn.style.transform = 'scale(1)';
            };
            btn.onmouseleave = () => {
                btn.style.transform = 'scale(1)';
            };

            link.appendChild(btn);
            btnWrapper.appendChild(link);

            // Create tooltip for hover button if provided
            if (hoverBtn.tooltipText) {
                const tooltip = document.createElement('div');
                tooltip.textContent = hoverBtn.tooltipText;
                tooltip.style.position = 'absolute';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.whiteSpace = 'nowrap';
                tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                tooltip.style.color = '#ffffff';
                tooltip.style.padding = '8px 16px';
                tooltip.style.borderRadius = '20px';
                tooltip.style.fontSize = '14px';
                tooltip.style.fontWeight = '500';
                tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                tooltip.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
                tooltip.style.opacity = '0';
                tooltip.style.zIndex = '1';

                const isRightSide = this.options.position.includes('right');
                if (isRightSide) {
                    tooltip.style.right = '70px';
                    tooltip.style.transform = 'translateX(10px)';
                } else {
                    tooltip.style.left = '70px';
                    tooltip.style.transform = 'translateX(-10px)';
                }

                btnWrapper.appendChild(tooltip);
                btnWrapper._tooltip = tooltip;
            }

            this.hoverButtonElements.push(btnWrapper);
            this.hoverButtonsContainer.appendChild(btnWrapper);
        });

        this.buttonWrapper.appendChild(this.hoverButtonsContainer);
    }

    createTooltip() {
        this.tooltip = document.createElement('div');
        this.tooltip.textContent = this.options.tooltipText;
        this.tooltip.style.position = 'absolute';
        this.tooltip.style.pointerEvents = 'none';
        this.tooltip.style.whiteSpace = 'nowrap';
        this.tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.tooltip.style.color = '#ffffff';
        this.tooltip.style.padding = '8px 16px';
        this.tooltip.style.borderRadius = '20px';
        this.tooltip.style.fontSize = '14px';
        this.tooltip.style.fontWeight = '500';
        this.tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        this.tooltip.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
        this.tooltip.style.opacity = '0';
        this.tooltip.style.zIndex = '3';

        // Position tooltip to the left of the button
        const isRightSide = this.options.position.includes('right');
        if (isRightSide) {
            this.tooltip.style.right = '70px';
            this.tooltip.style.transform = 'translateX(10px)';
        } else {
            this.tooltip.style.left = '70px';
            this.tooltip.style.transform = 'translateX(-10px)';
        }

        this.buttonWrapper.appendChild(this.tooltip);
    }

    setupEventListeners() {
        // Setup hover effect for showing/hiding hover buttons
        if (this.hoverButtonsContainer) {
            this.buttonWrapper.onmouseenter = () => {
                this.showHoverButtons();
            };

            this.buttonWrapper.onmouseleave = () => {
                this.scheduleHideHoverButtons();
            };
        }

        this.button.onmouseover = () => {
            this.button.style.backgroundColor = this.options.hoverColor;
            if (this.tooltip && !this.isOpen && !this.hoverButtonsVisible) {
                this.showTooltip();
            }
        };
        this.button.onmouseout = () => {
            this.button.style.backgroundColor = this.options.buttonColor;
            if (this.tooltip) {
                this.hideTooltip();
            }
        };
        this.button.onmousedown = () => {
            this.button.style.transform = 'scale(0.9)';
        };
        this.button.onmouseup = () => {
            this.button.style.transform = 'scale(1)';
        };
        this.button.onmouseleave = () => {
            this.button.style.transform = 'scale(1)';
        };

        this.button.onclick = (e) => {
            e.preventDefault();
            setTimeout(() => {
                this.toggle();
            }, 100);
        };

        this.mediaQuery.addEventListener('change', this.mediaQueryHandler);

        this.resizeHandler = () => {
            if (this.isOpen) {
                this.handleMediaChange(this.mediaQuery);
            }
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    handleMediaChange(e) {
        if (e.matches) {
            this.container.style.maxHeight = 'calc(100% - 20px)';
            this.container.style.width = this.isOpen ? '100%' : 'auto';
            this.container.style.paddingBottom = '10px';
            this.button.style.marginRight = '10px';
            this.button.style.marginLeft = '10px';
            this.iframeBox.style.borderRadius = '0';
            this.iframeBox.style.borderleft = '0';
            this.iframeBox.style.borderRight = '0';
        } else {
            this.container.style.maxHeight = 'calc(100% - 30px)';
            this.container.style.width = this.isOpen ? this.options.width + 'px' : 'auto';
            this.container.style.paddingBottom = '0';
            this.button.style.marginRight = '0';
            this.button.style.marginLeft = '0';
            this.iframeBox.style.borderRadius = '10px';
            this.iframeBox.style.border = '1px solid rgba(0,0,0,0.15)';
        }
        this.updateContainerPosition(e.matches);
    }

    showTooltip() {
        if (this.tooltip) {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.transform = 'translateX(0)';
        }
    }

    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
            const isRightSide = this.options.position.includes('right');
            this.tooltip.style.transform = isRightSide ? 'translateX(10px)' : 'translateX(-10px)';
        }
    }

    showHoverButtons() {
        if (!this.hoverButtonsContainer || this.isOpen) return;

        clearTimeout(this.hoverTimeout);
        this.hoverButtonsVisible = true;

        // Hide main button tooltip when showing hover buttons
        if (this.tooltip) {
            this.hideTooltip();
        }

        const isTopPosition = this.options.position.includes('top');

        this.hoverButtonElements.forEach((btnWrapper, index) => {
            btnWrapper.style.opacity = '1';
            // Calculate distance based on button position
            const distance = (index + 1) * 70; // 60px button + 10px gap
            if (isTopPosition) {
                btnWrapper.style.transform = `translateY(${distance}px)`;
            } else {
                btnWrapper.style.transform = `translateY(-${distance}px)`;
            }
        });
    }

    scheduleHideHoverButtons() {
        if (!this.hoverButtonsContainer) return;

        this.hoverTimeout = setTimeout(() => {
            this.hideHoverButtons();
        }, 100);
    }

    hideHoverButtons() {
        if (!this.hoverButtonsContainer) return;

        this.hoverButtonsVisible = false;

        this.hoverButtonElements.forEach((btnWrapper) => {
            btnWrapper.style.opacity = '0';
            btnWrapper.style.transform = 'translateY(0)';

            // Hide any visible tooltips
            if (btnWrapper._tooltip) {
                btnWrapper._tooltip.style.opacity = '0';
            }
        });
    }

    showHoverButtonTooltip(btnWrapper) {
        if (btnWrapper._tooltip) {
            btnWrapper._tooltip.style.opacity = '1';
            btnWrapper._tooltip.style.transform = 'translateX(0)';
        }
    }

    hideHoverButtonTooltip(btnWrapper) {
        if (btnWrapper._tooltip) {
            btnWrapper._tooltip.style.opacity = '0';
            const isRightSide = this.options.position.includes('right');
            btnWrapper._tooltip.style.transform = isRightSide ? 'translateX(10px)' : 'translateX(-10px)';
        }
    }

    getChatIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0,0,256,256"><g transform="translate(40.96,40.96) scale(0.68,0.68)"><g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" style="mix-blend-mode: normal"><g transform="scale(4,4)"><path d="M32,10c13.785,0 25,8.951 25,19.954c0,11.003 -11.215,19.953 -25,19.953c-0.646,0 -1.311,-0.022 -1.983,-0.065c-7.369,5.504 -13.411,6.251 -13.672,6.281c-0.076,0.009 -0.152,0.013 -0.228,0.013c-0.7,0 -1.356,-0.368 -1.72,-0.979c-0.402,-0.678 -0.369,-1.528 0.084,-2.172c0.023,-0.033 1.966,-2.8 4.003,-6.234c-7.138,-3.647 -11.484,-9.924 -11.484,-16.797c0,-11.003 11.215,-19.954 25,-19.954zM32,45.907c11.579,0 21,-7.157 21,-15.954c0,-8.797 -9.421,-15.953 -21,-15.953c-11.579,0 -21,7.157 -21,15.954c0,5.86 4.242,11.243 11.071,14.046c0.529,0.217 0.939,0.65 1.128,1.19c0.189,0.54 0.138,1.135 -0.142,1.634c-0.749,1.343 -1.521,2.635 -2.236,3.787c2.061,-0.888 4.615,-2.27 7.363,-4.401c0.398,-0.31 0.9,-0.458 1.4,-0.412c0.825,0.073 1.638,0.109 2.416,0.109z"></path></g></g></g></svg>';
    }

    getArrowIcon() {
        return '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="48" height="48" viewBox="0,0,256,256"><g transform="translate(40.96,40.96) scale(0.68,0.68)"><g fill="#ffffff" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" style="mix-blend-mode: normal"><g transform="scale(4,4)"><path d="M16,14c-0.512,0 -1.02306,0.19494 -1.41406,0.58594c-0.781,0.781 -0.781,2.04712 0,2.82812l14.58594,14.58594l-14.58594,14.58594c-0.781,0.781 -0.781,2.04713 0,2.82812c0.391,0.391 0.90206,0.58594 1.41406,0.58594c0.512,0 1.02306,-0.19494 1.41406,-0.58594l14.58594,-14.58594l14.58594,14.58594c0.781,0.781 2.04713,0.781 2.82812,0c0.781,-0.781 0.781,-2.04713 0,-2.82812l-14.58594,-14.58594l14.58594,-14.58594c0.781,-0.781 0.781,-2.04712 0,-2.82812c-0.781,-0.781 -2.04713,-0.781 -2.82812,0l-14.58594,14.58594l-14.58594,-14.58594c-0.391,-0.391 -0.90206,-0.58594 -1.41406,-0.58594z"></path></g></g></g></svg>';
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        if (!this.iframe.src) {
            this.iframe.src = this.iframeSrc;
        }
        this.isOpen = true;
        this.container.style.height = (this.options.height + 80) + 'px';
        this.container.style.width = this.options.width + 'px';
        this.container.style.minHeight = '300px';
        this.handleMediaChange(this.mediaQuery);
        this.iframeBox.style.display = 'block';
        this.button.innerHTML = this.getArrowIcon();
        this.backdrop.style.display = this.options.useBackdrop ? 'block' : 'none';

        // Trigger animation after display is set
        setTimeout(() => {
            this.iframeBox.style.opacity = '1';
            this.iframeBox.style.transform = 'translateY(0)';
        }, 10);
    }

    close() {
        this.isOpen = false;

        // Trigger close animation
        this.iframeBox.style.opacity = '0';
        this.iframeBox.style.transform = 'translateY(20px)';

        // Wait for animation to complete before hiding
        setTimeout(() => {
            this.container.style.height = 'auto';
            this.container.style.minHeight = 'auto';
            this.container.style.width = 'auto';
            this.iframeBox.style.display = 'none';
            this.backdrop.style.display = 'none';
        }, 300); // Match transition duration

        this.button.innerHTML = this.getChatIcon();
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.mediaQueryHandler) {
            this.mediaQuery.removeEventListener('change', this.mediaQueryHandler);
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Api2AppChatWidget;
}
