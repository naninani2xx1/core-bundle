"use strict";

var KTCKEditor4 = (function () {
    var editors = {};   // Lưu instance để destroy khi đóng modal

    /**
     * Cấu hình mặc định cho CKEditor 4
     */
    var defaultConfig = {
        language: 'vi',
        height: 400,
        toolbarGroups: [
            { name: 'document', groups: ['mode', 'document', 'doctools'] },
            { name: 'clipboard', groups: ['clipboard', 'undo'] },
            { name: 'editing', groups: ['find', 'selection', 'spellchecker'] },
            { name: 'basicstyles', groups: ['basicstyles', 'cleanup'] },
            { name: 'paragraph', groups: ['list', 'indent', 'blocks', 'align', 'bidi'] },
            { name: 'links' },
            { name: 'insert' },
            { name: 'styles' },
            { name: 'colors' },
            { name: 'tools' },
            { name: 'others' }
        ],
        // Nếu bạn muốn giữ một số nút quan trọng hơn, có thể chỉnh lại
        enterMode: CKEDITOR.ENTER_BR,
        shiftEnterMode: CKEDITOR.ENTER_P,
        allowedContent: true,           // Cho phép HTML tự do
        // filebrowserUploadUrl: '/upload/image',   // Nếu bạn có route upload ảnh
        // filebrowserImageUploadUrl: '/upload/image'
    };

    /**
     * Khởi tạo CKEditor 4 cho một textarea
     */
    var initEditor = function (textarea) {
        if (!textarea || !window.CKEDITOR) {
            console.warn('CKEditor 4 chưa được load hoặc textarea không tồn tại');
            return;
        }

        const editorId = textarea.id || 'ckeditor4-' + Date.now();

        if (!textarea.id) textarea.id = editorId;

        // Destroy nếu đã tồn tại
        if (editors[editorId]) {
            editors[editorId].destroy();
        }

        editors[editorId] = CKEDITOR.replace(textarea);
    };

    /**
     * Khởi tạo tất cả textarea có data-amz-ckeditor
     */
    var initAll = function () {
        document.querySelectorAll('textarea[data-amz-ckeditor]').forEach(function (textarea) {
            if (!textarea.hasAttribute('data-ckeditor4-initialized')) {
                initEditor(textarea);
                textarea.setAttribute('data-ckeditor4-initialized', 'true');
            }
        });
    };

    /**
     * Destroy tất cả editor (dùng khi đóng modal)
     */
    var destroyAll = function () {
        Object.keys(editors).forEach(function (id) {
            if (editors[id]) {
                editors[id].destroy();
                delete editors[id];
            }
        });
    };

    return {
        init: function () {
            initAll();

            // Tự động khởi tạo CKEditor khi modal được hiển thị
            $(document).on('shown.bs.modal', '.modal', function () {
                setTimeout(initAll, 350);   // Đợi modal render xong
            });

            // Destroy editor khi modal đóng (tránh memory leak)
            $(document).on('hidden.bs.modal', '.modal', function () {
                destroyAll();
            });
        },

        initAll: initAll,
        destroyAll: destroyAll,
        create: initEditor   // cho phép gọi thủ công nếu cần
    };
})();

window.KTCKEditor4 = KTCKEditor4;