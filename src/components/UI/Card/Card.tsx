import { FC, Fragment } from 'react'
import {
  FacebookShareButton,
  TwitterShareButton,
  FacebookIcon,
  TwitterIcon,
} from 'react-share'
import styled from 'styled-components'
import { Maybe } from '../../../generated/graphql'
import { formatDateTime } from '../../../utils/dateTransforms'

export type CardType = {
  title: string
  subtitle?: string
  exSubTitle?: string
  content: string
  url: Maybe<string> | undefined
  isPrivate?: boolean
  createdAt?: number
  updatedAt?: number
  createdBy: string
  venue: string
  hosted_by: string
  contact_number: string
  number_of_attendees: number
  speaker: string
}

type Props = {
  card: CardType
  onClick: () => void
}

const Card: FC<Props> = ({ card, onClick }) => {
  const {
    title,
    subtitle,
    content,
    url,
    isPrivate,
    exSubTitle,
    createdAt,
    updatedAt,
    createdBy,
    number_of_attendees,
    hosted_by,
    contact_number,
    speaker,
    venue,
  } = card

  return (
    <StyledCard onClick={onClick}>
      <div className='card-body'>
        <h5 className='card-title'>
          {title}{' '}
          <StyledSubTitle type={exSubTitle === 'Active' ? 'info' : 'warning'}>
            {exSubTitle}
          </StyledSubTitle>{' '}
          {isPrivate && <StyledPrivateBadge>Private</StyledPrivateBadge>}
        </h5>
        <h6 className='card-subtitle mb-2 text-muted'>{subtitle}</h6>
        {/* <p className='card-text'>{content}</p> */}
        <p className='card-text m-0'>Speaker : {speaker}</p>
        <p className='card-text m-0'>Venue : {venue}</p>
        <p className='card-text m-0'>Contact Number : {contact_number}</p>
        <p className='card-text m-0'>Hosted By : {hosted_by}</p>
        <p className='card-text m-0'>
          Number of Attendees: {number_of_attendees}
        </p>
        <p className='card-text'>
          <small className='text-muted'>
            posted by: {createdBy}{' '}
            {createdAt ? `on ${formatDateTime(createdAt)}` : null}
          </small>
          {updatedAt ? (
            new Date(updatedAt).getTime() !==
            new Date(createdAt ?? '').getTime() ? (
              <Fragment>
                <br />
                <small className='text-muted'>
                  updated on: {formatDateTime(updatedAt)}
                </small>
              </Fragment>
            ) : null
          ) : null}
        </p>
        <FacebookShareButtonStyled
          onClick={(e) => e.stopPropagation()}
          url={url ?? ''}
          className='card-link btn btn-outline-secondary'
        >
          <FacebookIcon size={32} round /> Share on Facebook
        </FacebookShareButtonStyled>
        <TwitterShareButtonStyled
          onClick={(e) => e.stopPropagation()}
          className='card-link btn btn-outline-secondary'
          title={title}
          url={url ?? ''}
          // hashtags={['hashtag1', 'hashtag2']}
        >
          <TwitterIcon size={32} round /> Share on Twitter
        </TwitterShareButtonStyled>
      </div>
    </StyledCard>
  )
}

const TwitterShareButtonStyled = styled(TwitterShareButton)`
  &:hover {
    text-decoration: underline;
    text-decoration-thickness: 2px;
  }
`

const FacebookShareButtonStyled = styled(FacebookShareButton)`
  &:hover {
    text-decoration: underline;
    text-decoration-thickness: 2px;
  }
`

export const StyledCard = styled.div.attrs(() => ({
  className: 'card',
}))`
  :hover {
    background-color: rgba(242, 241, 239);
    cursor: pointer;
  }
`

export const StyledSubTitle = styled.span.attrs<{ type: string }>(
  ({ type }) => ({
    className: `badge rounded-pill bg-${type} ${
      type === 'info' ? 'text-light' : 'text-dark'
    }`,
  }),
)<{ type: string }>`
  font-size: small;
  font-weight: 500;
`

export const StyledPrivateBadge = styled.span.attrs(() => ({
  className: 'badge rounded-pill bg-danger',
}))`
  font-size: small;
  font-weight: 500;
`

export default Card
