import {$} from 'meteor/jquery'

export const callback = ({expErr = true, expRes = true, onErr, onRes}) => (err, res) => {
  if (err) {
    errorCallback(err)
    if (onErr) onErr(err)
    return void 0
  }
  if (res && expRes) {
    $.notify({
      // options
      title: 'action successful',
    }, {
      // settings
      element: 'body',
      type: 'success',
      allow_dismiss: true,
      newest_on_top: false,
      showProgressbar: false,
      placement: {
        from: 'top',
        align: 'right'
      },
      offset: 20,
      spacing: 10,
      z_index: 1031,
      delay: 5000,
      timer: 1000,
    })
    if (onRes) onRes(res)
  }
}

export const errorCallback = (err) => {
  $.notify({
    // options
    title: err.error || err.name,
    message: err.reason || err.message,
  }, {
    // settings
    element: 'body',
    type: 'danger',
    allow_dismiss: true,
    newest_on_top: false,
    showProgressbar: false,
    placement: {
      from: 'top',
      align: 'right'
    },
    offset: 20,
    spacing: 10,
    z_index: 1031,
    delay: 5000,
    timer: 1000,
  })
}

export const wrap = (fct) => {
  try {
    fct()
  } catch (e) {
    errorCallback(e)
  }
}
