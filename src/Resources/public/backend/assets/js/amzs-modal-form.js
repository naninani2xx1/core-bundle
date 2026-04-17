"use strict";

var KTModalForm = (function () {
    var tableInstance = null;
    // var currentModal = null;
    var registeredCallbacks = [];   // Mảng chứa các hàm sẽ chạy sau khi form được load/reload

    // ==================== MỞ MODAL ====================
    // var openFormModal = function (url) {
    //     $('#modal-form-container').remove();
    //
    //     $.ajax({
    //         url: url,
    //         type: 'GET',
    //         success: function (response) {
    //             $('body').append('<div id="modal-form-container"></div>');
    //             $('#modal-form-container').html(response);
    //
    //             var $modalEl = $('#modal-form-container .modal');
    //             if ($modalEl.length === 0) return;
    //
    //             currentModal = new bootstrap.Modal($modalEl[0], {
    //                 backdrop: 'static',
    //                 keyboard: false
    //             });
    //
    //             initFormEvents($modalEl);
    //             runRegisteredCallbacks($modalEl);   // Chạy tất cả callback đã đăng ký
    //
    //             currentModal.show();
    //
    //             $modalEl.on('hidden.bs.modal', function () {
    //                 // Tự động destroy MediaLibrary nếu đang mở
    //                 if (typeof window.KTMediaLibrary !== 'undefined' &&
    //                     typeof window.KTMediaLibrary.destroy === 'function') {
    //                     window.KTMediaLibrary.destroy();
    //                 }
    //                 $('#modal-form-container').remove();
    //                 currentModal = null;
    //                 registeredCallbacks = [];
    //                 KTCKEditor4?.destroyAll();
    //             });
    //         },
    //         error: function () {
    //             Swal.fire({ text: "Không thể tải form", icon: "error" });
    //         }
    //     });
    // };

    // ==================== MỞ MODAL (ĐÃ TÍCH HỢP STACKED MODAL) ====================
    var openFormModal = function (url, isStacked = false) {
        // Nếu không phải stacked → xóa container cũ
        if (!isStacked) {
            $('#modal-form-container').remove();
        }

        $.ajax({
            url: url,
            type: 'GET',
            success: function (response) {
                // Tạo container mới (hỗ trợ stacked)
                var containerId = isStacked
                    ? `modal-form-container-${Date.now()}`
                    : 'modal-form-container';

                $('body').append(`<div id="${containerId}"></div>`);

                $(`#${containerId}`).html(response);

                var $modalEl = $(`#${containerId} .modal`);
                if ($modalEl.length === 0) return;

                // Ẩn modal trước đó nếu là stacked
                var previousModal = null;
                if (isStacked) {
                    const openedModals = document.querySelectorAll('.modal.show');
                    if (openedModals.length > 0) {
                        previousModal = openedModals[openedModals.length - 1];
                        previousModal.classList.add('d-none');
                    }
                }

                var modalInstance = new bootstrap.Modal($modalEl[0], {
                    backdrop: 'static',
                    keyboard: false
                });

                initCKEditorModalFix();

                $modalEl.data('modal-instance', modalInstance);
                $modalEl.removeAttr('aria-hidden')

                initFormEvents($modalEl,modalInstance);
                runRegisteredCallbacks($modalEl);

                // Thêm handler cho hidden.bs.modal (hỗ trợ stacked)
                $modalEl.on('hidden.bs.modal', function () {
                    // Tự động destroy MediaLibrary nếu đang mở
                    if (typeof window.KTMediaLibrary !== 'undefined' &&
                        typeof window.KTMediaLibrary.destroy === 'function') {
                        window.KTMediaLibrary.destroy();
                    }
                    $modalEl.data('aria-hidden', 'false');

                    // Xóa container hiện tại
                    $(`#${containerId}`).remove();

                    // Hiển thị lại modal trước đó nếu có
                    if (previousModal) {
                        previousModal.classList.remove('d-none');
                    }

                    // Điều chỉnh z-index nếu có nhiều modal stacked
                    if (isStacked) {
                        adjustStackedModals();
                    }

                    registeredCallbacks = [];
                    window.KTCKEditor4?.destroyAll();
                });

                modalInstance.show();
            },
            error: function () {
                Swal.fire({ text: "Không thể tải form", icon: "error" });
            }
        });
    };

    var initCKEditorModalFix = function () {
        document.addEventListener('keydown', function (e) {
            if (e.target.closest('.cke_dialog')) {
                e.stopImmediatePropagation();
            }
        }, true); // ⚠️ CAPTURE PHASE

        document.addEventListener('focusin', function (e) {
            if (e.target.closest('.cke_dialog')) {
                e.stopImmediatePropagation();
            }
        }, true);
        // $(document).off('focusin keydown');
        //
        // $(document).on('focusin', function (e) {
        //     if (e.target.closest('.cke_dialog')) {
        //         e.stopImmediatePropagation();
        //     }
        // });
        //
        // $(document).on('keydown', function (e) {
        //     if (e.target.closest('.cke_dialog')) {
        //         e.stopImmediatePropagation();
        //     }
        // });
    };

    // ==================== ĐIỀU CHỈNH Z-INDEX CHO STACKED MODALS ====================
    var adjustStackedModals = function () {
        const modals = [...document.querySelectorAll('.modal.show')];
        const backdrops = [...document.querySelectorAll('.modal-backdrop')];

        modals.forEach((m, i) => m.style.zIndex = 1050 + i * 20);
        backdrops.forEach((b, i) => b.style.zIndex = 1040 + i * 20);
    };

    // ==================== KHỞI TẠO CÁC EVENT CỐ ĐỊNH ====================
    var initFormEvents = function ($modalEl, modalInstance) {
        var $form = $modalEl.find('form');

        // Submit form
        $form.off('submit').on('submit', function (e) {
            e.preventDefault();

            var $submitBtn = $form.find('button[type="submit"]');
            $submitBtn.prop('disabled', true)
                .html('<span class="spinner-border spinner-border-sm"></span> Đang lưu...');

            $.ajax({
                url: $form.attr('action'),
                type: $form.attr('method') || 'POST',
                data: $form.serialize(),
                success: function () {
                    modalInstance.hide();
                    if (tableInstance) tableInstance.ajax.reload(null, false);

                    Swal.fire({
                        text: "Lưu thành công!",
                        icon: "success",
                        confirmButtonText: "OK",
                        customClass: { confirmButton: "btn btn-primary" }
                    });
                },
                error: function (xhr) {
                    $submitBtn.prop('disabled', false).html('Lưu');
                    Swal.fire({
                        text: xhr.responseJSON?.message || "Có lỗi xảy ra khi lưu.",
                        icon: "error",
                        confirmButtonText: "OK"
                    });
                }
            });
        });

        // ==================== HỖ TRỢ DYNAMIC FORM (quan trọng nhất) ====================
        // Khi có field có class "dynamic-trigger" thay đổi → reload form body
        $form.on('change', '.dynamic-trigger', function () {
            reloadFormBody($form, $modalEl);
        });
    };

    // Reload chỉ phần body của form (dynamic fields)
    var reloadFormBody = function ($form, $modalEl) {
        var formData = $form.serialize();
        var actionUrl = $form.attr('action');

        $.ajax({
            url: actionUrl,
            type: 'POST',
            data: formData + '&_dynamic_reload=1',   // flag để controller biết chỉ render body
            success: function (html) {
                // Tìm phần body của form và thay thế
                var $newForm = $(html).find('form');
                if ($newForm.length) {
                    $form.html($newForm.html());
                    runRegisteredCallbacks($modalEl);
                }
            },
            error: function () {
                console.error("Không thể reload dynamic form");
            }
        });
    };

    // ==================== CHẠY CÁC CALLBACK ĐÃ ĐĂNG KÝ ====================
    var runRegisteredCallbacks = function ($modalEl) {
        if(registeredCallbacks.length === 0){
            KTModalForm.registerCallback();
        }else{
            registeredCallbacks.forEach(function (callback) {
                if (typeof callback === 'function') {
                    try {
                        callback($modalEl);
                    } catch (e) {
                        console.error('Error in registered modal callback:', e);
                    }
                }
            });
        }
    };

    // ==================== PUBLIC API ====================
    return {
        // init: function () {
        //     // Mở modal
        //     $(document).on('click', '[data-amz-btn-open-modal]', function (e) {
        //         e.preventDefault();
        //         var url = $(this).attr('href') || $(this).data('url');
        //         if (url) openFormModal(url);
        //     });
        //
        //     // Xóa item
        //     $(document).on('click', '[data-amz-btn-remove]', function (e) {
        //         e.preventDefault();
        //         var url = $(this).attr('href') || $(this).data('action');
        //         if (url) deleteItem(url);
        //     });
        // },
        init: function () {
            // Mở modal - Hỗ trợ stacked qua data attribute
            $(document).on('click', '[data-amz-btn-open-modal]', function (e) {
                e.preventDefault();
                var url = $(this).attr('href') || $(this).data('url');
                var isStacked = $(this).data('stacked') === true ||
                    $(this).data('stacked-modal') === true;

                if (url) openFormModal(url, isStacked);
            });

            // Xóa item
            $(document).on('click', '[data-amz-btn-remove]', function (e) {
                e.preventDefault();
                var url = $(this).attr('href') || $(this).data('action');
                if (url) deleteItem(url);
            });
        },
        openFormModal: function (url, isStacked = false) {
            openFormModal(url, isStacked);
        },

        // ==================== API MỚI: ĐĂNG KÝ CALLBACK ====================
        registerCallback: function (callback) {
            if (typeof callback === 'function') {
                registeredCallbacks.push(callback);
            }
            return this; // cho phép chain
        },

        deleteItem: function (url) {
            Swal.fire({
                title: "Bạn chắc chắn muốn xóa?",
                text: "Hành động này không thể hoàn tác!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Có, xóa ngay!",
                cancelButtonText: "Hủy",
            }).then((result) => {
                if (result.isConfirmed) {
                    $.ajax({
                        url: url,
                        type: 'POST',
                        data: { _token: $('meta[name="csrf-token"]').attr('content') || '' },
                        success: function () {
                            Swal.fire({ text: "Đã xóa thành công!", icon: "success" });
                            if (tableInstance) tableInstance.ajax.reload(null, false);
                        },
                        error: function (xhr) {
                            Swal.fire({ text: xhr.responseJSON?.message || "Không thể xóa.", icon: "error" });
                        }
                    });
                }
            });
        },

        setDataTable: function (dt) {
            tableInstance = dt;
        },


        // Clear tất cả callback (nếu cần reset)
        clearCallbacks: function () {
            registeredCallbacks = [];
        }
    };
})();
KTModalForm.init();
window.KTModalForm = KTModalForm;