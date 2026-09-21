import { FC, useId, useState } from 'react';
import { useIntl } from 'react-intl';
import cn from 'classnames';
import { PenaltyNoteDto } from '@/contracts';
import { Button } from '@/sharedLayer/ui/Button';
import { settleViewportAfterKeyboard } from '@/sharedLayer/utils/settleViewport';
import classes from './PenaltyNoteForm.module.scss';

type Ground = NonNullable<PenaltyNoteDto['ground']>;

type PenaltyNoteFormProps = {
  title: string;
  grounds: readonly Ground[];
  // the only ground that fits: the others are switched off and its words are already written
  onlyGround?: Ground;
  // grounds that do not fit now
  disabledGrounds?: readonly Ground[];
  confirmLabel: string;
  confirmVariant?: 'primary' | 'warning';
  isLoading: boolean;
  onConfirm: (note: PenaltyNoteDto) => void;
  onBack: () => void;
};

const COMMENT_MAX_LENGTH = 500;

// Why a gate user is blocked or unblocked: a ready-made ground writes its words into the comment,
// the operator may add their own. Without any words the action is not confirmed.
export const PenaltyNoteForm: FC<PenaltyNoteFormProps> = ({
  title, grounds, onlyGround, disabledGrounds = [], confirmLabel, confirmVariant = 'primary', isLoading, onConfirm, onBack,
}) => {
  const { $t } = useIntl();
  const id = useId();
  const labelOf = (ground: Ground) => $t({ id: `penalty ground: ${ground}` });

  const [ground, setGround] = useState<Ground | null>(onlyGround ?? null);
  const [comment, setComment] = useState(onlyGround ? labelOf(onlyGround) : '');

  const choose = (next: Ground) => {
    const label = labelOf(next);
    setGround(next);
    // the words of another ground are replaced, the words of the operator stay
    setComment((current) => {
      const own = grounds.reduce((text, item) => text.replace(labelOf(item), ''), current).replace(/^[\s,.;]+/, '').trim();
      return own ? `${label}. ${own}` : label;
    });
  };

  return (
    <div className={classes.form}>
      <p className={classes.title}>{title}</p>

      <div className={classes.grounds}>
        {grounds.map((item) => (
          <button
            key={item}
            type="button"
            className={cn(classes.ground, { [classes.chosen]: item === ground })}
            disabled={isLoading || disabledGrounds.includes(item) || (onlyGround !== undefined && item !== onlyGround)}
            aria-pressed={item === ground}
            onClick={() => choose(item)}
          >
            {labelOf(item)}
          </button>
        ))}
      </div>

      <div className={classes.field}>
        <label className={classes.label} htmlFor={id}>{$t({ id: 'penalty note: comment' })}</label>
        <textarea
          id={id}
          className={classes.textarea}
          rows={3}
          maxLength={COMMENT_MAX_LENGTH}
          value={comment}
          disabled={isLoading}
          onChange={(event) => setComment(event.target.value)}
          onBlur={settleViewportAfterKeyboard}
        />
        {!comment.trim() && <p className={classes.hint}>{$t({ id: 'penalty note: hint' })}</p>}
      </div>

      <div className={classes.actions}>
        <Button
          fullWidth
          variant={confirmVariant}
          disabled={isLoading || !comment.trim()}
          onClick={() => onConfirm({ ground, comment: comment.trim() })}
        >
          {confirmLabel}
        </Button>
        <Button fullWidth disabled={isLoading} onClick={onBack}>
          {$t({ id: 'penalty note: back' })}
        </Button>
      </div>
    </div>
  );
};
