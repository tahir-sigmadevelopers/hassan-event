import { FC, ReactNode } from 'react'
import { MdSaveAlt } from 'react-icons/md'
import { FiLogIn, FiTrash2 } from 'react-icons/fi'
import styled from 'styled-components'
import { Modal as ModalBootstrap, Button } from 'react-bootstrap'
import { BtnSpinner } from '../BtnSpinner/BtnSpinner'

type ActionBtnFlagsType = {
  submitBtnName?: string
  closeBtnName?: string
  disableDeleteBtn?: boolean
  displayDeleteBtn?: boolean
  disableSubmitBtn?: boolean
  hideSubmitBtn?: boolean
}

type ActionBtnLoadingType = {
  isSubmitLoading: boolean
  isDeleteLoading?: boolean
}

type Props = {
  title: string
  show: boolean
  actionBtnFlags?: ActionBtnFlagsType
  actionBtnLoading?: ActionBtnLoadingType
  closeButton?: boolean
  children?: ReactNode
  onClose: () => void
  onDelete?: () => void
  onSubmit: () => void
  size?: 'sm' | 'lg' | 'xl'
}

const Modal: FC<Props> = ({
  title,
  show,
  actionBtnFlags,
  actionBtnLoading,
  closeButton = true,
  children,
  onClose,
  onSubmit,
  onDelete,
  size = 'lg',
}) => {
  const {
    submitBtnName,
    closeBtnName,
    displayDeleteBtn,
    disableDeleteBtn,
    disableSubmitBtn,
    hideSubmitBtn,
  } = actionBtnFlags ?? {}

  const { isSubmitLoading, isDeleteLoading } = actionBtnLoading ?? {}

  return (
    <ModalBootstrap
      show={show}
      backdrop='static'
      keyboard={false}
      onHide={onClose}
      size={size}
      dialogClassName="modal-wide"
    >
      <ModalBootstrap.Header closeButton={closeButton}>
        <ModalBootstrap.Title>{title}</ModalBootstrap.Title>
      </ModalBootstrap.Header>
      <ModalBootstrap.Body>{children}</ModalBootstrap.Body>
      <ModalBootstrap.Footer>
        <Button variant='secondary' onClick={onClose}>
          {closeBtnName || 'Cancel'}
        </Button>
        {displayDeleteBtn && (
          <Button
            variant='danger'
            disabled={disableDeleteBtn}
            onClick={onDelete}
          >
            {isDeleteLoading && <BtnSpinner />} Remove <FiTrash2 />
          </Button>
        )}
        {!hideSubmitBtn && (
          <Button
            variant='primary'
            disabled={disableSubmitBtn}
            onClick={onSubmit}
          >
            {isSubmitLoading && <BtnSpinner />} {submitBtnName || 'Save'}{' '}
            {submitBtnName ? <FiLogIn /> : <MdSaveAlt />}
          </Button>
        )}
      </ModalBootstrap.Footer>
    </ModalBootstrap>
  )
}

export const StyledModal = styled.div.attrs(() => ({
  className: 'modal-dialog',
}))`
  @media (min-width: 768px) {
    .modal-dialog {
      min-width: 512px;
    }
  }
`

// Add custom CSS to the document to style modals better
const style = document.createElement('style');
style.textContent = `
  .modal-wide {
    min-width: 80%;
    max-width: 1200px;
  }
  
  @media (max-width: 768px) {
    .modal-wide {
      min-width: 95%;
    }
  }
`;
document.head.appendChild(style);

export default Modal
