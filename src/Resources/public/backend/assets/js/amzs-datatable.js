"use strict";

var KTAmzDataTable = (function () {
    var table;
    var currentConfig = {};

    /**
     * Khởi tạo DataTable chung
     * @param {Object} config
     */
    var init = function (config) {
        currentConfig = $.extend(true, {
            tableId: 'kt_datatable',
            ajaxUrl: '',
            parentId: null,
            scrollCollapse: true,
            scrollY: '50vh',
            columns: [],
            order: [[1, 'asc']],
            pageLength: 10,
            searchDelay: 350,
            languageFilter: true,
            searchInputId: 'kt_amz_search_input',
            languageSelectId: 'kt_amz_language_select'
        }, config);
        // Kiểm tra xem filter ngôn ngữ có tồn tại không
        var $languageSelect = $('#' + currentConfig.languageSelectId);
        currentConfig.enableLanguageFilter = $languageSelect.length > 0;
        table = $('#' + currentConfig.tableId).DataTable({
            processing: true,
            serverSide: true,
            lengthChange: false,
            pageLength: currentConfig.pageLength,
            order: currentConfig.order,
            searchDelay: 500,

            ajax: {
                url: currentConfig.ajaxUrl,
                type: "GET",
                data: function (d) {
                    // Filter ngôn ngữ
                    if (currentConfig.enableLanguageFilter) {
                        d.language = $languageSelect.val() || '';
                    }
                    delete d.columns;
                    delete d.column;
                }
            },

            columns: currentConfig.columns,

            // Tích hợp search từ input tùy chỉnh
            initComplete: function () {
                setupCustomSearch();
            }
        });

        // Gán cho ModalForm (để sau khi lưu modal thì reload table)
        if (typeof KTModalForm !== 'undefined') {
            KTModalForm.setDataTable(table);
        }

        setupLanguageFilter();
    };

    /**
     * Setup tìm kiếm từ input tùy chỉnh với debounce + Enter
     */
    var setupCustomSearch = function () {
        var searchTimeout;

        $('#' + currentConfig.searchInputId).on('keyup', function (e) {
            var value = $(this).val().trim();

            // Nhấn Enter → search ngay
            if (e.key === 'Enter' || e.keyCode === 13) {
                clearTimeout(searchTimeout);
                table.search(value).draw();
                return;
            }

            // Debounce 350ms
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(function () {
                table.search(value).draw();
            }, 350);
        });
    };

    /**
     * Setup filter ngôn ngữ
     */
    var setupLanguageFilter = function () {
        if (!currentConfig.languageFilter) return;

        $('#' + currentConfig.languageSelectId).on('change', function () {
            table.ajax.reload(null, false);   // false = giữ nguyên trang hiện tại
        });
    };

    /**
     * Public API
     */
    return {
        init: init,

        // Cho phép reload table từ bên ngoài
        reload: function () {
            if (table) table.ajax.reload(null, false);
        },

        // Lấy instance DataTable nếu cần
        getTable: function () {
            return table;
        }
    };
})();

window.KTAmzDataTable = KTAmzDataTable;